# Poligon Shooter

Tarayıcıda çalışan tek sayfalık poligon shooter prototipi.

## Yeni Oyun Akışı

- Oyun alanı `1920x1080` (Full HD) canvas ile hazırlanmıştır.
- Tüm silahlar masa üstü silah rafında görünür.
- Başlangıçta sadece 2 silah açıktır, gelişmiş silahlar kilitli gelir.
- Tur atladıkça yeni silahlar tur sonu mağazada açılır.
- Her tur sonunda ara ekran açılır:
  - 🛒 Silah mağazası
  - 🎨 Kozmetik mağazası
- Kozmetik mağazada farklı atış alanı ve renkli hedef paketleri alınabilir.
- 10. turdan sonra sniper silahlar açılır, uzak mesafe atış modu devreye girer.

## Sesler

- Atış sesi
- Şarjör değiştirme sesi
- Başarılı (merkez) isabet sesi
- Zayıf (dış halka) isabet sesi
- Iskalama/ceza sesleri

## Kurallar

- 10 atış = 1 tur
- Tur başına +$1
- Her 3 ardışık isabet +$1
- Her 5 başarılı atışta hedef daha da uzaklaşır
- Rehine vurulursa ceza uygulanır

## Kontroller

- Nişan: Fare hareketi
- Ateş: Sol tık veya `Space`
- Yakınlaşma: Sağ tık (basılı tut)
- Silahı masadan alma: `E`
- Yeniden doldurma: `R`
