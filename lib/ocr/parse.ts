export type OcrParsed = {
  name: string;
  company: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  address: string;
  website: string;
};

export function parseOcrText(rawText: string): OcrParsed {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // --- 高精度: 正規表現で確定できる項目 ---

  const emailMatch = rawText.match(
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
  );
  const email = emailMatch?.[0] ?? "";

  // 日本の固定・携帯・フリーダイヤル + 国際表記
  const phoneMatch = rawText.match(
    /(?:\+81[-\s]?|0)[\d]{1,4}[-\s]?[\d]{2,4}[-\s]?[\d]{4}/
  );
  const phone = phoneMatch?.[0].replace(/\s/g, "") ?? "";

  const websiteMatch = rawText.match(/https?:\/\/[^\s\n]+|www\.[^\s\n]+/i);
  const website = websiteMatch?.[0] ?? "";

  // --- ヒューリスティック: キーワードで絞り込む ---

  const companyRe =
    /株式会社|有限会社|合同会社|一般社団法人|公益社団法人|LLC|L\.L\.C|Inc\.|Co\.,?\s*Ltd\.|Corporation|Corp\.|Group|Holdings/i;
  const companyLine = lines.find((l) => companyRe.test(l)) ?? "";

  const deptRe = /部$|課$|室$|グループ$|チーム$|Department|Division|Div\./i;
  const deptLine = lines.find((l) => deptRe.test(l)) ?? "";

  const posRe =
    /部長|課長|係長|主任|リーダー|マネージャー|ディレクター|代表取締役|代表|社長|専務|常務|取締役|CEO|COO|CTO|CFO|Manager|Director|President|Engineer|Consultant/i;
  const posLine =
    lines.find((l) => posRe.test(l) && !companyRe.test(l)) ?? "";

  // 住所: 都道府県 or 郵便番号 or 番地表現を含む行
  const addrRe = /[都道府県市区町村]|〒|\d{3}[-‐]\d{4}|\d+丁目|\d+番地/;
  const addrLines = lines.filter(
    (l) =>
      addrRe.test(l) &&
      !companyRe.test(l) &&
      !(phone && l.includes(phone))
  );
  const address = addrLines.join(" ");

  // --- 名前: 消去法で残った短い行から推定 ---
  const usedSet = new Set(
    [companyLine, deptLine, posLine, ...addrLines].filter(Boolean)
  );

  const nameCandidates = lines.filter((l) => {
    if (usedSet.has(l)) return false;
    if (email && l.includes(email)) return false;
    if (phone && l.includes(phone.replace(/[-]/g, ""))) return false;
    if (website && l.includes(website)) return false;
    if (companyRe.test(l)) return false;
    if (l.length < 2 || l.length > 20) return false;
    // 数字が多い行（電話・郵便番号など）を除外
    const digitRatio = (l.match(/\d/g)?.length ?? 0) / l.length;
    if (digitRatio > 0.4) return false;
    // 記号だけの行を除外
    if (/^[^\p{L}\p{N}]+$/u.test(l)) return false;
    return true;
  });

  const name = nameCandidates[0] ?? "";

  return {
    name,
    company: companyLine,
    department: deptLine,
    position: posLine,
    email,
    phone,
    address,
    website,
  };
}
