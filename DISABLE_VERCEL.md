# Vercelの統合を無効化する方法

Railwayに移行したため、GitHubのVercelチェックを無効化する手順です。

## 方法1: Vercelダッシュボードから無効化（最も確実）

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクト `loto6-check` を選択（または、プロジェクト一覧から該当プロジェクトを探す）
3. **「Settings」**タブを開く
4. 下にスクロールして**「Git」**セクションを開く
5. **「Disconnect Git Repository」**ボタンをクリック
6. 確認ダイアログで**「Disconnect」**をクリック

**重要**: これで、GitHubへのプッシュ時にVercelのデプロイチェックが実行されなくなります。

## 方法2: GitHubリポジトリの設定から削除

もし方法1で解決しない場合：

1. GitHubリポジトリ `Itou-Hiroaki-qqq/loto6-check` を開く
2. **「Settings」**タブを開く
3. 左サイドバーで**「Integrations」** → **「Installed GitHub Apps」**をクリック
4. **「Vercel」**を探してクリック
5. **「Configure」**をクリック
6. **「Repository access」**セクションで：
   - **「Only select repositories」**を選択
   - `loto6-check`のチェックを外す
   - または、**「Uninstall」**をクリックして完全に削除
7. 変更を保存

## 方法2: GitHubリポジトリの設定から削除

1. GitHubリポジトリ `Itou-Hiroaki-qqq/loto6-check` を開く
2. **「Settings」**タブを開く
3. 左サイドバーで**「Integrations」** → **「Installed GitHub Apps」**をクリック
4. **「Vercel」**を探してクリック
5. **「Configure」**をクリック
6. **「Only select repositories」**を選択し、`loto6-check`のチェックを外す
7. または、**「Uninstall」**をクリックして完全に削除

## 方法3: GitHubのブランチ保護ルールを確認（該当する場合）

もしブランチ保護ルールでVercelチェックが必須になっている場合：

1. GitHubリポジトリ `Itou-Hiroaki-qqq/loto6-check` を開く
2. **「Settings」**タブを開く
3. 左サイドバーで**「Branches」**をクリック
4. `main`ブランチの保護ルールを編集（または追加）
5. **「Require status checks to pass before merging」**のチェックを外す
   - または、Vercelチェックのチェックを外す
6. 変更を保存

## 方法4: Vercelプロジェクトを削除（最終手段）

Railwayへの移行が完了し、Vercelが不要になった場合：

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクト `loto6-check` を選択
3. **「Settings」**タブを開く
4. 一番下の**「Delete Project」**セクションを開く
5. プロジェクト名を入力して削除

**注意**: 削除すると復元できません。Railwayへの移行が完了していることを確認してから実行してください。

## 確認方法

1. GitHubリポジトリの**「Actions」**タブを開く
2. 最新のコミット/プッシュで、Vercelチェックが表示されなくなっていることを確認
3. プルリクエストを作成して、Vercelチェックが表示されないことを確認

## トラブルシューティング

### まだVercelチェックが表示される場合

1. **ブラウザのキャッシュをクリア**して、GitHubページを再読み込み
2. **数分待つ**（GitHubの設定反映に時間がかかる場合がある）
3. **新しいコミットをプッシュ**して、チェックが実行されるか確認

### Vercelダッシュボードにプロジェクトが見つからない場合

- 別のアカウントでログインしている可能性があります
- Vercelのアカウント設定を確認してください

## 注意

- Vercelの統合を無効化しても、Vercelダッシュボードから手動でデプロイすることは可能です
- Railwayへの移行が完了したら、Vercelのプロジェクトは削除しても構いません
