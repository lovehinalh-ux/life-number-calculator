# Life Number Calculator (React)

## 專案簡介
以 React + Vite 實作的生命靈數計算機，使用者輸入生日後可即時計算：
- 後天數
- 卓越數
- 主命數
- 九宮格圖形（圓圈/三角形/正方形）
- 主命數解讀與九宮格線組合說明

## 主要技術
- React + Vite
- lucide-react（UI icon）
- Tailwind CSS（基礎樣式工具鏈）
- shadcn 生態相容套件：`class-variance-authority`、`clsx`、`tailwind-merge`
- ESLint + eslint-plugin-security（資安規則）

## 安裝與啟動
```bash
npm install
npm run dev
```

## 常用指令
```bash
npm run dev    # 啟動開發環境
npm run build  # 產生 production build
npm run lint   # 進行程式碼與安全規則檢查
```

## 環境變數
請先複製 `.env.example` 並填入必要值：
```bash
cp .env.example .env
```

注意：`VITE_` 開頭的變數會被打包進前端，不可放置真正秘密金鑰。

## 部署方式
### GitHub Actions
已提供 workflow：`.github/workflows/deploy.yml`
- 觸發條件：`main` 分支 push / PR
- 動作：`npm ci` -> `npm run lint` -> `npm run build`

### Vercel / GitHub Pages
目前專案內未偵測到 `vercel.json`、`.vercel/` 或 GitHub Pages 專用設定。
如需部署到該平台，可再新增對應配置。
