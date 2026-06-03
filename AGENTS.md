<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Clash Royale Meta Deck Finder - AI Agents Guide (`agents.md`)

Bu dosya, projenin amacını, dosya yapısını, kullanılacak teknolojileri ve Yapay Zeka (AI) davranış kurallarını içerir. Yeni bir sohbet veya bağlam açıldığında, AI agent'ının projenin mevcut durumunu ve kurallarını hızlıca anlayabilmesi için tasarlanmıştır.

---

## 1. Proje Özeti (Project Overview)

Bu projenin amacı, Clash Royale oyuncularının kendi kart seviyelerine, sahip oldukları evrimlere (Evolutions) ve kahramanlara (Champions) göre o anki aktif Clash Royale metasındaki en uygun desteleri bulmasını ve filtrelemesini sağlamaktır.

### Temel Özellikler:
*   **Oyuncu Profili Sorgulama:** Oyuncunun oyuncu etiketi (player tag) ile Clash Royale API'sinden profil verilerini çekmek. Sahip olduğu kartları, seviyelerini, evrimlerini ve kahramanlarını analiz etmek.
*   **Meta Destelerin Çekilmesi:** Güncel metada en çok oynanan veya kazanma oranı en yüksek destelerin çekilmesi ve listelenmesi (API veya kazıma yöntemleri ile).
*   **E-Sporcu (Pro) Deste Takibi:** Dünyanın en iyi Clash Royale e-sporcularının (Mohamed Light, Mugi, Ian77 vb.) güncel maçlarını ve destelerini özel olarak listeleyen ve filtreleyen bir sistem. (İlk aşamada `pro_players.json` dosyasındaki statik etiketler analiz edilecek, ilerleyen süreçte profildeki derece/rozet verilerine göre dinamik tespit edilmesi test edilecektir.)
*   **Akıllı Deste Eşleştirme Algoritması:** Oyuncunun kart havuzunu meta destelerle karşılaştırıp en uygun olanları listelemek.
*   **Gelişmiş Filtreleme ve Öneri Sistemi:**
    *   *Kart Seçimi:* Belirli kartların destede olmasını zorunlu kılma.
    *   *Evrim/Kart Açma Simülasyonu:* "1 Evrim Açabilirim", "2 Evrim Açabilirim", "1 Kahraman/Kart Açabilirim" veya "2 Kahraman/Kart Açabilirim" filtreleri. Bu filtreler sayesinde kullanıcıya "Şu evrimi/kartı açarsan şu meta desteyi de oynayabilirsin" gibi nokta atışı akıllı tavsiyeler sunulacaktır.
*   **Geçmiş Sezon Metası ve Görsel Önbellekleme (Ek Özellikler):** 
    *   *Sezon Seçimi:* Aktif sezona ek olarak bir önceki sezonun dondurulmuş metası ile eşleştirme yapabilme imkanı.
    *   *Görsel Önbellek:* Supercell CDN değişikliklerinden etkilenmemek amacıyla görsellerin yerel depoda (`public/images/cards/`) barındırılması ve bulunamayan görseller için `onError CDN fallback` koruması.
*   **Modern Web Arayüzü:** Premium tasarıma sahip, dinamik ve mikro etkileşimli modern bir kullanıcı arayüzü.

---

## 2. Yapay Zeka Davranış Kuralları (AI Rules)

### 2.1 Onay Zorunluluğu
*   **Her büyük iş adımından önce** kullanıcıdan açık onay alınır.
*   "Büyük iş" örnekleri: yeni modül oluşturma, mimari değişiklik, yeni bağımlılık ekleme, veritabanı şeması değiştirme, mevcut dosyaları yeniden yapılandırma.
*   Basit düzeltmeler (typo, yorum ekleme, küçük refactor) doğrudan uygulanabilir.
*   Onay alınmadan hiçbir **yapım (implementation) aşamasına** geçilmez.

### 2.2 Fikir Üretme & Öneri
*   Yapay zeka yeni fikirler veya alternatif yaklaşımlar önerebilir.
*   Öneriler açıkça **"Öneri:"** etiketi ile sunulur.
*   Öneri sunulduktan sonra kullanıcı onayı beklenir; onay olmadan uygulanmaz.

### 2.3 Ücretsiz & Açık Kaynak Politikası
*   Kullanılan tüm kütüphaneler, araçlar ve veri kaynakları **ücretsiz ve açık kaynaklı** olmalıdır.
*   Ücretli API, servis veya eklenti **kesinlikle kullanılmaz**.
*   Telif hakkıyla korunan içerik (font, ikon, veri seti vb.) **kullanılmaz**.
*   Kullanılan her bağımlılığın lisansı `LICENSES.md` dosyasında belgelenir.

### 2.4 İleriye Yönelik Düşünme
*   Kod yazılırken "bu ileride nasıl genişler?" sorusu sorulur.
*   Hard-coded değerler (dil kodu, dosya yolu vb.) asla yazılmaz; sabitler veya yapılandırma dosyaları kullanılır.

### 2.5 İletişim Dili
*   Teknik tartışmalar ve dosya açıklamaları: **Türkçe**
*   Kaynak kod içi yorumlar ve dokümantasyon (KDoc/JSDoc): **İngilizce**

### 2.6 Arayüz İçerik Politikası (UI Content Policy)
*   **Yalınlık & Netlik:** Web sitesinde gereksiz, süslü/dekoratif yazılar, uzun pazarlama açıklamaları veya kalabalık bilgi yığınları kesinlikle bulunmamalıdır. Tasarım temiz, doğrudan veri odaklı, sade ve işlevsel olmalıdır.

---

## 3. Planlanan Dosya Yapısı (Target Folder Structure)

*Öneri: Projeyi bir Next.js (App Router) + TypeScript + Vanilla CSS yapısında kurmak, Clash Royale API'sine backend üzerinden (Route Handler) güvenli ve CORS engeline takılmadan istek atmamızı kolaylaştıracaktır.*

```text
CR/
├── agents.md               # Bu dosya (AI Kuralları ve Proje Yapısı)
├── progress.md             # Proje yapım fazları ve ilerleme durumu
├── DESIGN.md               # Google Stitch uyumlu tasarım sistemi (Renk, tipografi vb.)
├── LICENSES.md             # Kullanılan kütüphanelerin lisans bilgileri
├── package.json
├── next.config.js          # Yapılandırma dosyaları
├── .github/
│   └── workflows/
│       └── update-meta.yml # Her gün meta desteleri ve pro oyuncu destelerini çekip güncelleyen GitHub Action betiği
├── src/
│   ├── app/                # Next.js App Router sayfaları ve API route'ları
│   │   ├── layout.tsx      # Genel düzen (Layout)
│   │   ├── page.tsx        # Ana sayfa (Profil sorgulama ve deste listesi)
│   │   └── api/
│   │       └── player/     # Oyuncu verilerini çeken API proxy'si
│   ├── components/         # Yeniden kullanılabilir UI bileşenleri
│   │   ├── ProfileCard.tsx # Oyuncu profil kartı
│   │   ├── DeckList.tsx    # Destelerin listelendiği bileşen
│   │   ├── DeckCard.tsx    # Tekil deste kartı (Oyuna kopyalama butonu dahil)
│   │   └── Filters.tsx     # Kart filtreleme ve evrim simülasyonu bileşeni
│   ├── config/
│   │   └── index.ts        # Uygulama genel sabitleri (API limitleri, eşik değerleri vb.)
│   ├── data/
│   │   ├── meta_decks.json # GitHub Action tarafından derlenen en son meta desteler
│   │   ├── previous_season_decks.json # Bir önceki sezona ait dondurulmuş meta desteler
│   │   ├── current_season.json # Kayıtlı güncel sezon ID verisi
│   │   └── pro_players.json # E-sporcuların (Pro) oyuncu etiketlerini içeren liste (Mohamed Light, Mugi vb.)
│   ├── services/           # Clash Royale API entegrasyonu ve iş mantığı
│   │   ├── royaleApi.ts    # Resmi API çağrıları
│   │   └── deckMatcher.ts  # Deste eşleştirme ve isteğe bağlı öneri algoritması
│   ├── styles/             # Global stiller ve tasarım token'ları
│   │   ├── globals.css     # CSS Variables (Color, Typography, Shadows)
│   │   └── theme.css       # Premium tema ayarları (Dark mode, Glassmorphism)
│   └── utils/              # Yardımcı fonksiyonlar
│       └── cardHelpers.ts  # Nadirlik ve iksir değerlerini tutan ortak yardımcı modül

```

---

## 4. Altyapı ve Yayınlama (Deployment & Infrastructure)

### 4.1 Sunucu ve Barındırma (Hosting)
*   **Vercel (Hobi Planı):** Proje, Vercel üzerinde **tamamen ücretsiz** olarak barındırılacaktır. 
    *   Next.js ile tam entegre çalışır.
    *   İstemci tarafındaki CORS engellerini aşmak ve API Key'i gizlemek için Next.js **Route Handler (Serverless API)** desteği sunar.
    *   GitHub deposuna her kod gönderildiğinde (push) siteyi otomatik olarak derleyip yayına alır.

### 4.2 Otomatik Meta Veri Güncelleme Hattı (GitHub Actions Pipeline)
*   RoyaleAPI gibi devasa veri sunan siteler Supercell'in resmi "Developer Partner"ı olup doğrudan veri tabanı senkronizasyonuna veya çok yüksek istek limitlerine sahiptir. Standart bir geliştirici anahtarı ile canlı olarak her kullanıcı girdiğinde 1000 oyuncuyu taramak API limitlerine takılacaktır.
*   **Çözüm:** Depomuzda ücretsiz bir **GitHub Action** iş akışı kuracağız.
    *   Bu iş akışı günde bir kez arka planda otomatik olarak çalışır.
    *   Resmi Clash Royale API'sinden global ilk 1000 oyuncunun etiketlerini ve `src/data/pro_players.json` dosyasındaki pro oyuncuların etiketlerini alır.
    *   Bu oyuncuların son maç geçmişlerini (`/battlelog`) ve aktif destelerini analiz eder.
    *   En çok kullanılan ve kazanma oranı en yüksek desteleri belirler.
    *   **API Limit Koruması:** İsteklerin API limitlerine takılmaması (Rate limit 429 hatası) için ardışık istekler arasına kısa bekleme süreleri (örn. 50ms gecikme veya limitli paralel istekler) konulur ve hata durumunda otomatik yeniden deneme (exponential backoff) uygulanır.
    *   Sonuçları `src/data/meta_decks.json` dosyasına yazıp depoya otomatik olarak commit eder. Ayrıca indirilen yeni kart görsellerini ve sezon arşivlerini de depoya pushlar.
    *   Değişiklik depoya yansıdığında Vercel siteyi statik olarak yeniden derler. Bu sayede web sitemiz **0ms veritabanı/API gecikmesiyle** son derece hızlı çalışır.

#### 4.2.1 Veri Analiz Algoritması (GitHub Action Script Detayı)
GitHub Action tetiklendiğinde arka planda çalışan Node.js betiği şu adımları izler:
1.  **Veri Toplama:** İlk 1000 oyuncunun ve `pro_players.json` içindeki oyuncuların `/battlelog` verilerini çeker.
2.  **Maç Filtreleme:** Sadece rekabetçi oyun modlarındaki (`type: "pathOfLegend"` veya `"challenge"`) maçlar analize dahil edilir. Dostluk maçları veya 2v2 gibi eğlence modları filtrelenir.
3.  **Deste Benzersizleştirme (Deck Signature):** Her maçtaki 8 kartın ID'leri sayısal olarak sıralanıp aralarına noktalı virgül (`;`) konularak benzersiz bir anahtar (`deckId`) oluşturulur (Örn: `26000000;26000012;...`).
4.  **Kazanma Durumu:** Oyuncunun kron sayısı rakibinden fazla ise (`teamCrowns > opponentCrowns` veya `crownsEarned` kıyaslaması) o maç "Galibiyet" olarak sayılır.
5.  **İstatistik Toplama:** Bellekteki bir haritada (Map) her `deckId` için `useCount` (kullanım sayısı) ve `winCount` (kazanma sayısı) toplanır.
6.  **Filtreleme & Eşik Değeri:** Sadece 1 kez oynanıp kazanan (yalancı %100 kazanma oranına sahip) desteleri engellemek için, sadece belirli bir kullanım sınırını (Örn: en az 5-10 maç) aşan desteler hesaba katılır.
7.  **Sıralama:** Desteler kazanma oranına (`winRate / useCount`) ve kullanım sıklığına göre sıralanarak en iyi 30 deste `meta_decks.json` içerisine kaydedilir. E-sporcu desteleri ise ayrı bir `pro_decks` etiketi altında toplanır.
8.  **Sezon Geçiş Kontrolü:** Betik, resmi API'den en son Path of Legend sezon ID'sini denetler. Eğer bu ID, `current_season.json` dosyasındakinden farklıysa, mevcut `meta_decks.json` dosyası `previous_season_decks.json` olarak kopyalanıp arşivlenir ve yeni sezon verileri sıfırdan oluşturulmaya başlanır.
9.  **Görsel Önbellekleme:** Betik, derlenen destelerdeki tüm kart ID'lerini tarar. Eğer `public/images/cards/{id}.png` dosya yolunda kartın resmi yerel olarak bulunmuyorsa, CDN üzerinden indirip kaydeder.

### 4.3 Deste Kopyalama (Copy Deck) Özelliği
*   Clash Royale oyununun desteklediği resmi URL şemasını kullanacağız:
    `https://link.clashroyale.com/deck/en?deck=ID1;ID2;ID3;ID4;ID5;ID6;ID7;ID8`
*   Her deste kartında bir **"Oyuna Kopyala"** butonu olacak. Bu buton, kullanıcının cihazında oyunu otomatik olarak açarak desteyi doğrudan boş bir slota kopyalamasını sağlayacaktır.

### 4.4 Simülasyon Filtreleme Kuralları (Eksik Kart/Evrim)
*   **Varsayılan Durum:** Algoritma sadece kullanıcının o anki kart seviyeleri ve evrimlerine göre %100 kurabileceği desteleri listeler.
*   **İsteğe Bağlı Filtre (Toggle / Seçim):** Kullanıcı filtre panelinden şu simülasyon filtrelerini ayrı ayrı açabilir:
    *   *Evrim Açabilirim:* "1 Evrim Açabilirim" veya "2 Evrim Açabilirim".
    *   *Kahraman/Kart Açabilirim:* "1 Kahraman/Kart Açabilirim" veya "2 Kahraman/Kart Açabilirim".
*   Seçilen filtre değerine göre, oyuncunun o an sahip olmadığı veya evrimleştirmediği kart/evrim sayısı tolerans dahilinde tutulur. Deste üzerinde eksik olan kartlar ve açılması gereken evrimler kullanıcıya tavsiye rozetiyle gösterilir (örn: *"1 Evrim Gerekli: Knight evrimini açarak bu desteyi oynayabilirsiniz"*).

### 4.5 Mimari Kararlar ve Risk Yönetimi (Architecture & Risk Management)
*   **Failsafe (Hata Güvenliği):** GitHub Actions veri toplama betiği, çekilen veri miktarını doğrular. Eğer elde edilen geçerli meta deste sayısı belirlenen eşik değerinin (örn. en az 20 deste) altındaysa, işlem iptal edilir ve mevcut çalışan `meta_decks.json` dosyası üzerine yazılmaz.
*   **İstemci Tarafı Hesaplama (Client-Side Processing):** Kullanıcının kart havuzu ile meta destelerin karşılaştırılması ve simülasyon hesaplamaları tamamen tarayıcı (istemci) tarafında yapılır. Bu, sunucu yükünü sıfıra indirir ve arayüz filtrelerinin anlık (0ms gecikmeli) tepki vermesini sağlar.
*   **Gevşek Bağlı Yapı (Loosely Coupled):** Veri şeması ve servis katmanı olabildiğince bağımsız kurulacaktır. İleride tarihsel meta analizi yapılmak istenirse, static JSON dosya yapısından bir veritabanına (örn. Supabase veya Redis) geçiş kolayca yapılabilecektir.
