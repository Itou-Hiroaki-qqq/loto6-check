# Vercelの統合を無効化する方法

Railwayに移行したため、GitHubのVercelチェックを無効化する手順です。

## 方法1: Vercelダッシュボードから無効化（推奨）

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクト `loto6-check` を選択
3. **「Settings」**タブを開く
4. **「Git」**セクションを開く
5. **「Disconnect Git Repository」**をクリック
6. 確認ダイアログで**「Disconnect」**をクリック

これで、GitHubへのプッシュ時にVercelのデプロイチェックが実行されなくなります。

## 方法2: GitHubリポジトリの設定から削除

1. GitHubリポジトリ `Itou-Hiroaki-qqq/loto6-check` を開く
2. **「Settings」**タブを開く
3. 左サイドバーで**「Integrations」** → **「Installed GitHub Apps」**をクリック
4. **「Vercel」**を探してクリック
5. **「Configure」**をクリック
6. **「Only select repositories」**を選択し、`loto6-check`のチェックを外す
7. または、**「Uninstall」**をクリックして完全に削除

## 方法3: GitHub Actionsの設定を確認（該当する場合）

もし`.github/workflows`ディレクトリにVercel関連のワークフローファイルがある場合：

1. `.github/workflows/vercel.yml`などのファイルを削除
2. 変更をコミットしてプッシュ

## 確認

GitHubリポジトリの**「Actions」**タブで、Vercel関連のチェックが表示されなくなっていることを確認してください。

## 注意

- Vercelの統合を無効化しても、Vercelダッシュボードから手動でデプロイすることは可能です
- Railwayへの移行が完了したら、Vercelのプロジェクトは削除しても構いません
