# Frostfront RTS (Java)

Bu depo, senin istediğin **soğuk gezegen temalı 3B RTS** oyununun Java tarafında çalışan bir **çekirdek prototipini** içerir.

## İçerik
- 5 ırk: İnsanlar, Orklar, Elfler, Necronlar, İleri İnsanlar
- Irk bazlı avantaj/dezavantaj ve fantezi (ilahi) güç tanımları
- Savaş birimi + kaynak toplama birimi modeli
- Kaynak sistemi: odun, su, taş, altın, ateş
- Ateş tabanlı hayatta kalma mekaniği (ateş yoksa birlikler ölür)
- Varlık yönetimi: birim, envanter, sur dayanımı
- Girdi yönetimi: kamera değiştirme, toplama emri, ateş aç/kapa komutları
- Kamera modları: sabit / serbest
- 3B render katmanı için `Renderer3D` soyut prototipi

> Not: Bu sürüm, tam 3B görsel motor yerine oynanış çekirdeğini kurar. Gerçek 3B sahne için jMonkeyEngine veya LWJGL ile `Renderer3D` genişletilir.

## Motor seçimi (Unity mi Java mı?)
Kısa cevap: **Bu kapsam için Unity daha doğru seçim**.

- **Unity (önerilen):**
  - 3B RTS için hazır sahne/editör, animasyon, navmesh, ışıklandırma, profiler, asset ekosistemi sunar.
  - Kamera (free/fixed), UI, pathfinding, VFX, bina/sur sistemini hızlı iterasyonla çıkarırsın.
  - Takım büyürse üretim hattı ve araç ekosistemi daha sürdürülebilir olur.
- **Sadece Java (mevcut prototip):**
  - Oynanış kuralları, simülasyon ve backend mantığını yazmak için iyi.
  - Ama modern 3B üretim kalitesi için motor/araç yükü çok artar (render pipeline, editor tooling, asset pipeline).
  - Tek başına/hobi projede olur; ticari kalite RTS’de maliyeti yükseltir.

### Pratik öneri
- **Hybrid yaklaşım:**
  - Oynanış/simülasyon mantığını (kurallar, ekonomi, savaş hesapları) bu Java çekirdeğinde tut.
  - İstemciyi Unity’de yap; Java’yı authoritative server/simulation katmanı olarak konumlandır.

## Çalıştırma
```bash
mvn -q compile
mvn -q exec:java
```

## Sonraki adımlar
1. jMonkeyEngine entegrasyonu
2. Harita, bina ve pathfinding sistemi
3. Silah/zırh geliştirme ağacı
4. Irk başına özel birimler ve ilahi güç yetenek ağacı
5. Çok oyunculu (authoritative server) altyapısı
