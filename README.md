# Nova Dominion — Offline Uzay Stratejisi

İnternet bağlantısı ve sunucu hesabı gerektirmeyen, OGame türünden ilham alan tek oyunculu bir uzay strateji oyunu. Projede iki ayrı sürüm bulunur: iPhone ve masaüstü tarayıcılar için görsel web oyunu ile terminalde çalışan tur tabanlı CLI oyunu.

> Bu bağımsız bir projedir; resmi OGame ürünü veya birebir klonu değildir.

## Hızlı başlangıç

Gereksinimler: Python 3.10+ ve testler için Node.js 20+.

```bash
git clone https://github.com/Emremmt/codex.git
cd codex
npm run serve
```

Ardından [http://localhost:8000](http://localhost:8000) adresini aç. İnternet gerekmez; sayfanın dosyalara erişebilmesi için yerel sunucu çalışır durumda olmalıdır.

Terminal sürümünü başlatmak için:

```bash
npm run cli
```

Node.js kullanmak istemiyorsan aynı komutlar doğrudan çalıştırılabilir:

```bash
python3 -m http.server 8000 --directory webgame
python3 ogame_offline.py
```

## Web oyunu

Yeni oyun açılırken bot sayısı sorulur. iPhone'da akıcı kullanım için varsayılan 50, üst sınır 120 bottur; masaüstünde varsayılan 100, üst sınır 250 bottur.

Temel döngü:

1. Gezegenler panelinden yöneteceğin koloniyi seç.
2. Madenleri, enerji üretimini, laboratuvarı ve tersaneyi geliştir.
3. Teknoloji araştır; gemi, savunma ve officer üret.
4. Hedefi ad, koordinat veya sahip bilgisiyle ara; saldırı, casusluk, taşıma ya da recycler görevi gönder.
5. Görev dönüşlerini ve ganimeti raporlardan izle; ittifak, savaş ve iki taraflı ticaret sistemiyle ilerle.

Koloni gemisi yalnızca boş ve savunmasız nötr gezegenleri kolonileştirir. Koloni kapasitesi Astrofizik araştırmasına bağlıdır. İttifak savaşlarında çatışmalar gerçek savaş sonucuna göre puan üretir ve hedef 100 puandır.

### iPhone kullanımı

- Safari'de bilgisayarın yerel ağ adresini aç: örneğin `http://192.168.1.20:8000`.
- Alt gezinme çubuğu Üs, Üretim, Komuta, İttifak ve Rapor panellerine hızlı erişim verir.
- Kontroller en az 44 px dokunma alanı, çentik/güvenli alan desteği ve yatay kaydırılan gemi kartları kullanır.
- Yıldız alanı ekran çözünürlüğüne göre ölçeklenir; piksel oranı, kare hızı, yıldız ve bot sayısı mobilde sınırlandırılır.
- Yerel ağdaki HTTP oturumlarında `crypto.randomUUID()` bulunmasa bile oyun uyumlu bir yerel kimlik üreticisine geri döner.

### Ses ve müzik

Üst çubuktaki **Sesi Aç** düğmesine ilk kez dokununca efektler ve düşük yoğunluklu uzay müziği başlar. Safari, kullanıcı etkileşimi olmadan ses oynatılmasına izin vermediği için sayfa her yenilendiğinde bu ilk dokunuş gerekir. Müzik ayrı kapatılabilir ve genel ses seviyesi ayarlanabilir.

Sesler harici dosya veya ağ isteği kullanmaz. Tıklama, filo dönüşü, başarı, uyarı, zafer ve yenilgi efektleri ile ambient müzik Web Audio API üzerinden çalışma anında özgün olarak üretilir. Müzik ve ses seviyesi tercihi oyun kaydından bağımsız olarak aynı tarayıcıda saklanır; sekme arka plana geçtiğinde ses askıya alınır.

### Kayıtlar

- **Kaydet / Yükle:** O anki tarayıcının `localStorage` alanını kullanır.
- **Dışa / İçe Aktar:** JSON metnini başka cihaza elle taşımayı sağlar.
- Kayıt şeması sürümlüdür. Eski görev kayıtları eksik alanlarla yüklenebilir; geçersiz sayılar sınırlandırılır ve bozuk temel şema reddedilir.
- Tarayıcı verilerini silmek yerel kaydı da siler; önemli oyunlarda JSON dışa aktarımı al.

## Web ve terminal sürümü farkları

| Özellik | Web | Terminal |
|---|:---:|:---:|
| Bina, araştırma, filo ve savunma | ✓ | ✓ |
| Bot ekonomisi ve savaş | ✓ | ✓ |
| Gerçek zamanlı gidiş/dönüş görevleri | ✓ | — |
| Koloni seçimi, taşıma, casusluk, recycler, sefer | ✓ | — |
| İttifak, mesajlaşma, savaş skoru, ticaret sözleşmesi | ✓ | — |
| Officer ve unique gemiler | ✓ | — |
| Prosedürel efekt ve ambient müzik | ✓ | — |
| Local/JSON kayıt | ✓ | — |
| Seed ile tekrarlanabilir galaksi | — | ✓ |

İki sürüm farklı oyun motorları kullanır; ilerleme ve kayıt dosyaları birbiriyle uyumlu değildir.

## Test ve geliştirme

Tüm sözdizimi kontrollerini, web testlerini ve terminal testlerini tek komutla çalıştır:

```bash
npm test
```

Ayrı ayrı çalıştırmak için:

```bash
npm run check
npm run test:web
npm run test:cli
```

Testler görev gidiş/dönüşleri, ganimet ve taşıma, kolonizasyon sınırı, oyuncu elenmesi, savaş kayıpları, ittifak puanı, iki taraflı ticaret, gemi önkoşulları, benzersiz koordinatlar, iPhone'a özgü statik performans/ses kuralları ve kayıt migrasyonunu kapsar. GitHub Actions her push ve pull request'te aynı `npm test` komutunu çalıştırır.

## Bilinen sınırlar

- Oyun tamamen tek oyunculudur; çevrimiçi hesap, gerçek oyuncu veya sunucu senkronizasyonu yoktur.
- Web sürümü servis worker içermez. Dosyalar yerelde olsa da oyun sayfası için yerel HTTP sunucusu gerekir.
- Terminal sürümünde kayıt sistemi ve web'e özgü diplomasi/görev modülleri henüz yoktur.
