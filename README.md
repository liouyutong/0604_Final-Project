# 口腔影像分析系統：應用於智慧醫療物聯網
(Oral Image Analysis System for Smart Medical IoT)

## 📖 專案簡介
本專案為第九組的期末成果，開發一套結合 AI 影像辨識與物聯網技術的口腔健康監測系統。透過高清口腔內窺鏡與智慧演算法，協助使用者在家中即可進行精準的口腔檢測，實現「早發現、早治療」，填補專業牙醫診斷間的空窗期。

## 🎯 核心特徵 (Key Features)
*   **高品質影像採集**：支援多角度拍攝，並具備引導框確保影像品質。
*   **全景拼接技術**：利用 SIFT/SLAM 演算法將多張照片合稱為完整的口腔全景圖。
*   **AI 智能診斷**：自動辨識齲齒 (Caries)、牙結石 (Calculus)、牙齦紅腫及口腔潰瘍。
*   **高風險預警**：針對疑似口腔癌前病變（破、斑、硬、突、腫）提供即時就醫建議。
*   **個人化健康管理**：結合 LLM + RAG 技術，提供專屬的潔牙導航與保健建議。

## 📁 檔案清單與說明
*   **口腔影像分析.pdf**：專案簡報，詳細介紹研究動機、市場痛點、解決方案與實驗結果。
*   **規格書.md**：系統詳細技術規格說明。
*   **智慧物聯網.mp4**：專案介紹與系統演示影片。
*   **程式碼/**：本專案訓練與測試程式碼集中目錄。

## 🧠 程式部分介紹
本專案程式部分主要分為兩大功能：模型訓練與測試評估。

### 主要程式檔案
*   **`程式碼/train_oral_health_classifier.py`**
    *   讀取 `Dataset/Training` 的影像與 YOLO 標註資料。
    *   將標註的 `class_id` 轉換成 3 類口腔健康狀態。
    *   使用 PyTorch 的 ResNet50 進行遷移學習，並進行訓練與驗證。
    *   透過 early stopping 自動儲存最佳模型權重。
    *   輸出訓練過程的損失函數曲線與驗證準確率。

*   **`程式碼/evaluate_oral_health_classifier.py`**
    *   讀取 `Dataset/Test` 的影像與標註資料。
    *   載入訓練好的模型權重，計算整體 Test 準確率。
    *   可直接顯示模型在測試資料上的預測成效。
    *   生成詳細的分類報告與混淆矩陣。

*   **`程式碼/requirements.txt`**
    *   列出專案所需的 Python 套件及版本。
    *   包含 PyTorch、torchvision、OpenCV、scikit-learn 等依賴。

*   **`程式碼/程式說明.md`**
    *   詳細說明 Dataset 結構、標註格式與程式使用方式。
    *   提供資料前處理步驟與模型架構說明。

*   **`程式碼/run_train.bat` 與 `程式碼/run_train.ps1`**
    *   提供快速啟動訓練的執行腳本（Windows 批次檔與 PowerShell 指令碼）。

### 使用方式
1. **安裝依賴**
   ```bash
   pip install -r 程式碼/requirements.txt
   ```

2. **訓練模型**
   ```bash
   python 程式碼/train_oral_health_classifier.py
   ```

3. **測試模型**
   ```bash
   python 程式碼/evaluate_oral_health_classifier.py
   ```

### 資料集結構
```
Dataset/
├── Training/
│   ├── Images/          # 訓練集影像
│   └── Labels/          # YOLO 格式標註
├── Validation/
│   ├── Images/          # 驗證集影像
│   └── Labels/          # YOLO 格式標註
└── Test/
    ├── Images/          # 測試集影像
    └── Labels/          # YOLO 格式標註
```

## 🔬 技術指標
*   **辨識準確率 (mAP)**：整體辨識率達 **0.85**。
*   **診斷類別**：涵蓋硬組織（牙齒）、軟組織（牙齦/黏膜）及清潔死角分析。

## 👥 團隊成員 (Team)
**第九組**
*   4112056006 劉禹彤
*   4112056032 黃喻琦
*   4112056033 廖沛昀

---
*專案更新日期：2026 年 4 月 21 日*  
*資料來源：衛福部 110-112 年人口腔健康調查、WHO 全球口腔健康覆蓋目標 2030*
