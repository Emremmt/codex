package com.rts;

public enum RaceType {
    HUMANS(new RaceProfile(
            "İnsanlar",
            "Dengeli ekonomi ve güçlü sur inşası",
            "İlahi güç açma maliyetleri yüksek",
            1.0,
            1.0,
            1.0,
            "Sanctified Aegis: Sur ve birimlere kutsal kalkan"
    )),
    ORCS(new RaceProfile(
            "Orklar",
            "Yüksek yakın dövüş hasarı",
            "Kaynak toplama verimi düşük",
            1.25,
            0.85,
            1.1,
            "Blood Rage: Kısa süreli devasa saldırı artışı"
    )),
    ELVES(new RaceProfile(
            "Elfler",
            "Hızlı kaynak toplama ve menzilli isabet",
            "Düşük zırh dayanımı",
            0.95,
            1.2,
            0.9,
            "Moon Ward: Gece görüşü ve kritik ok saldırıları"
    )),
    NECRONS(new RaceProfile(
            "Necronlar",
            "Yeniden canlanma ve soğukta dayanıklılık",
            "Su tüketimleri yüksek",
            1.1,
            0.95,
            0.85,
            "Reanimation Protocol: Düşen birimlerin bir kısmını diriltir"
    )),
    ADVANCED_HUMANS(new RaceProfile(
            "İleri İnsanlar",
            "Yüksek teknoloji silah/zırh sinerjisi",
            "Altın bağımlılığı çok yüksek",
            1.15,
            1.05,
            1.15,
            "Quantum Overdrive: Mekanik birliklerde hız ve ateş gücü artışı"
    ));

    private final RaceProfile profile;

    RaceType(RaceProfile profile) {
        this.profile = profile;
    }

    public RaceProfile profile() {
        return profile;
    }
}
