import argparse
import os
import random
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from tqdm import tqdm

# 1. 請根據你的資料集標註重新檢查並調整這個映射。
#    目前是示範用，將 YOLO 標註檔中的 class id 轉成 3 類健康狀態。
YOLO_TO_HEALTH = {
    0: 0,  # 無異常
    1: 1,  # 輕微發炎
    2: 2,  # 嚴重發炎
    3: 1,  # 例如輕度問題
    4: 2,  # 例如嚴重問題
    5: 2,  # 例如嚴重問題
}
CLASS_NAMES = ["normal", "mild_inflammation", "severe_inflammation"]
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")


def parse_args():
    parser = argparse.ArgumentParser(description="Train oral health status CNN model.")
    parser.add_argument("--dataset_dir", type=str, default="Dataset/Training",
                        help="Path to training dataset directory.")
    parser.add_argument("--img_size", type=int, default=224,
                        help="Image resize height and width.")
    parser.add_argument("--batch_size", type=int, default=16,
                        help="Training batch size.")
    parser.add_argument("--epochs", type=int, default=5,
                        help="Number of training epochs.")
    parser.add_argument("--output", type=str, default="saved_models/oral_health_classifier.h5",
                        help="Saved model output path.")
    return parser.parse_args()


def find_files(directory, extension):
    return sorted([os.path.join(directory, f) for f in os.listdir(directory)
                   if f.lower().endswith(extension)])


def load_yolo_labels(label_path):
    with open(label_path, "r", encoding="utf-8") as f:
        labels = [line.strip().split()[0] for line in f if line.strip()]
    return [int(x) for x in labels if x.isdigit()]


def derive_health_label(label_ids):
    if not label_ids:
        return 0
    severity = 0
    for cid in label_ids:
        severity = max(severity, YOLO_TO_HEALTH.get(cid, max(YOLO_TO_HEALTH.values())))
    return severity


def prepare_dataset(dataset_dir):
    images_dir = os.path.join(dataset_dir, "Images")
    labels_dir = os.path.join(dataset_dir, "Labels")

    if not os.path.isdir(images_dir):
        raise FileNotFoundError(f"Images directory not found: {images_dir}")
    if not os.path.isdir(labels_dir):
        raise FileNotFoundError(f"Labels directory not found: {labels_dir}")

    image_files = find_files(images_dir, ".jpg") + find_files(images_dir, ".png")
    if not image_files:
        raise ValueError(f"No image files found in {images_dir}")

    dataset = []
    for img_path in image_files:
        img_name = os.path.splitext(os.path.basename(img_path))[0]
        label_path = os.path.join(labels_dir, f"{img_name}.txt")
        if not os.path.exists(label_path):
            print(f"Warning: no label file for image {img_path}, skipping.")
            continue

        label_ids = load_yolo_labels(label_path)
        health_label = derive_health_label(label_ids)
        dataset.append((img_path, health_label))

    if not dataset:
        raise ValueError("No valid image-label pairs were found. Please check your dataset structure.")

    random.seed(42)
    random.shuffle(dataset)
    return dataset


class OralHealthDataset(Dataset):
    def __init__(self, samples, img_size, transform=None):
        self.samples = samples
        self.img_size = img_size
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, torch.tensor(label, dtype=torch.long)


def build_dataloaders(train_samples, val_samples, img_size, batch_size):
    train_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_ds = OralHealthDataset(train_samples, img_size, transform=train_transform)
    val_ds = OralHealthDataset(val_samples, img_size, transform=val_transform)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)
    return train_loader, val_loader


def build_model(img_size):
    model = models.resnet50(pretrained=True)
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_features, len(CLASS_NAMES))
    )
    return model.to(DEVICE)


def train_epoch(model, dataloader, criterion, optimizer):
    model.train()
    total_loss = 0.0
    correct = 0
    total = 0

    for images, labels in tqdm(dataloader, desc="Training"):
        images = images.to(DEVICE)
        labels = labels.to(DEVICE)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        _, predicted = torch.max(outputs, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

    avg_loss = total_loss / len(dataloader)
    accuracy = 100 * correct / total
    return avg_loss, accuracy


def validate(model, dataloader, criterion):
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in tqdm(dataloader, desc="Validating"):
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            outputs = model(images)
            loss = criterion(outputs, labels)

            total_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    avg_loss = total_loss / len(dataloader)
    accuracy = 100 * correct / total
    return avg_loss, accuracy


def main():
    args = parse_args()
    dataset = prepare_dataset(args.dataset_dir)

    split_index = int(len(dataset) * 0.8)
    train_samples = dataset[:split_index]
    val_samples = dataset[split_index:]

    print(f"Total samples: {len(dataset)}")
    print(f"Training samples: {len(train_samples)}")
    print(f"Validation samples: {len(val_samples)}")
    print(f"Classes: {CLASS_NAMES}")

    train_loader, val_loader = build_dataloaders(
        train_samples, val_samples, args.img_size, args.batch_size
    )

    model = build_model(args.img_size)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-4)

    best_val_loss = float('inf')
    patience = 5
    patience_counter = 0

    for epoch in range(args.epochs):
        print(f"\nEpoch {epoch + 1}/{args.epochs}")
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc = validate(model, val_loader, criterion)

        print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
        print(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            os.makedirs(os.path.dirname(args.output), exist_ok=True)
            torch.save(model.state_dict(), args.output)
            print(f"Model saved to {args.output}")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping at epoch {epoch + 1}")
                break

    print("Training completed!")



if __name__ == "__main__":
    main()
