-- business_cards に OCR 関連カラムを追加
ALTER TABLE business_cards
  ADD COLUMN IF NOT EXISTS original_image_url text,
  ADD COLUMN IF NOT EXISTS raw_ocr_text       text;

-- ============================================================
-- Supabase Storage: card-images バケット設定
-- ダッシュボードで「card-images」バケットを作成した後に実行
-- ============================================================

-- 自分のフォルダへのアップロードを許可
CREATE POLICY "card_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'card-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 自分のファイルの読み取りを許可
CREATE POLICY "card_images_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'card-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 自分のファイルの削除を許可
CREATE POLICY "card_images_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'card-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
