# OnlyOffice Web (Vue 3 繁體中文版)

基於only-office的純本地專案，支援本地`開啟、編輯`office檔案

[live-demo🪄](https://anomixer.github.io/onlyoffice-web-local/)


[English](README.md) | [中文](readme.zh.md)


基於 OnlyOffice 的本地網頁檔案編輯器，讓您直接在瀏覽器中編輯檔案，無需伺服器端處理，保護您的隱私安全。

## ✨ 主要特性

- 🔒 **隱私優先**: 所有檔案處理都在瀏覽器本地進行，不上傳到任何伺服器
- 📝 **多格式支援**: 支援 DOCX、XLSX、PPTX 等多種檔案格式
- ⚡ **即時編輯**: 提供流暢的即時檔案編輯體驗
- 🚀 **無需部署**: 純前端實現，無需伺服器端處理
- 🎯 **即開即用**: 開啟網頁即可開始編輯檔案



## 📄 開啟遠端檔案

### 功能說明

透過路由引數自動下載並開啟遠端 Office 檔案（如 `.docx`、`.pptx` 等），並將其轉換為 `File` 物件供後續使用（如預覽或編輯）。

### 使用方法

頁面地址需包含以下引數：

* `url`（必填）：遠端檔案地址
* `filename`（可選）：檔名，如果未提供將嘗試自動解析

示例：
[00.xlsx](https://anomixer.github.io/onlyoffice-web-local/#/?url=https://sweetwisdom.github.io/react-filePreview/filePreview/00.xlsx)

```
?filename=00.pptx&url=https://example.com/files/00.pptx
```

### 檔名獲取優先順序

1. 路由引數 `filename`
2. 從 `url` 中解析
3. 從響應頭 `Content-Disposition` 提取

若無法獲取檔名，將終止操作並提示錯誤。



## word

![recording](./.imgs/recording.gif)

## excel

![image-20250524104950359](./.imgs/image-20250524104950359.png)

## ppt

![image-20250524105044644](./.imgs/image-20250524105044644.png)



## 匯出文件

![image-20250524104854846](./.imgs/image-20250524104854846.png)

## 開發支援

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

## Docker 支援

自定義映象名為 vue-local-office 的映象（請注意下面命令末尾有一個點 . 表示使用當前路徑下的 Dockerfile 檔案，可根據實際情況指定路徑）

docker build -t vue-local-office .

埠對映並啟動 docker 容器（8080:80：表示在容器中使用 80 埠，並將該埠轉發到主機的 8080 埠；local-office：表示自定義容器名；vue-local-office：表示自定義映象名）

docker run -dp 8080:80 --name local-office vue-local-office

操作完上面兩個命令後，在瀏覽器開啟 http://localhost:8080 即可預覽

## 技術原理

使用x2t-wam替代onlyofice服務

使用only-office websdk  實現編輯(來自se-office)

## 參考

[Qihoo360/se-office: se-office擴充套件，提供基於開放標準的全功能辦公生產力套件，基於瀏覽器預覽和編輯office。](https://github.com/Qihoo360/se-office)

[cryptpad/onlyoffice-x2t-wasm: CryptPad WebAssembly file conversion tool](https://github.com/cryptpad/onlyoffice-x2t-wasm)

