@echo off
REM 使用虛擬環境執行訓練腳本
cd /d "%~dp0"
echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Running training script...
python.exe train_oral_health_classifier.py --dataset_dir Dataset/Training --epochs 5 --batch_size 16

pause
