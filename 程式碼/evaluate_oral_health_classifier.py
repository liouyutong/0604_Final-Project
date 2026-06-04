import argparse
import os
from PIL import Image
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from tqdm import tqdm

YOLO_TO_HEALTH = {
    0: 0,
    1: 1,
    2: 2,
    3: 1,
    4: 2,
    5: 2,
}
CLASS_NAMES = ["normal", "mild_inflammation", "severe_inflammation"]
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate oral health classifier on test data.")
    parser.add_argument("--dataset_dir", type=str, default="Dataset/Test",
                        help="Path to test dataset directory.")
    parser.add_argument("--model_path", type=str, default="saved_models/oral_health_classifier.h5",
                        help="Path to saved model weights.")
    parser.add_argument("--img_size", type=int, default=224,
                        help="Image resize height and width.")
    parser.add_argument("--batch_size", type=int, default=16,
                        help="Batch size for evaluation.")
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

    return dataset


class OralHealthDataset(Dataset):
    def __init__(self, samples, transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, torch.tensor(label, dtype=torch.long)


def build_dataloader(samples, img_size, batch_size):
    transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    dataset = OralHealthDataset(samples, transform=transform)
    return DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)


def build_model():
    model = models.resnet50(pretrained=False)
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_features, len(CLASS_NAMES))
    )
    return model.to(DEVICE)


def evaluate(model, dataloader):
    model.eval()
    total = 0
    correct = 0
    with torch.no_grad():
        for images, labels in tqdm(dataloader, desc="Evaluating"):
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
    return correct, total


def main():
    args = parse_args()
    samples = prepare_dataset(args.dataset_dir)
    print(f"Test samples: {len(samples)}")

    dataloader = build_dataloader(samples, args.img_size, args.batch_size)
    model = build_model()

    if not os.path.exists(args.model_path):
        raise FileNotFoundError(f"Model file not found: {args.model_path}")

    model.load_state_dict(torch.load(args.model_path, map_location=DEVICE))
    correct, total = evaluate(model, dataloader)
    accuracy = correct / total * 100 if total > 0 else 0.0
    print(f"\nTest Accuracy: {accuracy:.2f}% ({correct}/{total})")


if __name__ == "__main__":
    main()
