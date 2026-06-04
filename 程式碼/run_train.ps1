# 啟動虛擬環境並執行訓練腳本
$venv_path = ".\.venv\Scripts\Activate.ps1"
$script_path = ".\train_oral_health_classifier.py"

Write-Host "Activating virtual environment..." -ForegroundColor Green
& $venv_path

Write-Host "Running training script..." -ForegroundColor Green
python.exe $script_path `
    --dataset_dir Dataset/Training `
    --epochs 5 `
    --batch_size 16 `
    --img_size 224

Write-Host "Training completed!" -ForegroundColor Green
