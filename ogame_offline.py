#!/usr/bin/env python3
"""
Galaksi Fatihi Online (offline sürüm)
OGame ilhamlı, terminal tabanlı büyük ölçekli strateji oyunu.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import math
import random


RES = ("metal", "crystal", "deuterium")

# Basit stil için ANSI renkleri
C = {
    "reset": "\033[0m",
    "title": "\033[95m",
    "star": "\033[96m",
    "ok": "\033[92m",
    "warn": "\033[93m",
    "danger": "\033[91m",
    "muted": "\033[90m",
}


BUILDINGS: Dict[str, Dict[str, object]] = {
    "metal_mine": {"label": "Metal Madeni", "base": {"metal": 60, "crystal": 15, "deuterium": 0}, "factor": 1.5},
    "crystal_mine": {"label": "Kristal Madeni", "base": {"metal": 48, "crystal": 24, "deuterium": 0}, "factor": 1.6},
    "deut_synth": {"label": "Deuterium Sentezleyici", "base": {"metal": 225, "crystal": 75, "deuterium": 0}, "factor": 1.5},
    "solar_plant": {"label": "Güneş Santrali", "base": {"metal": 75, "crystal": 30, "deuterium": 0}, "factor": 1.5},
    "robot_factory": {"label": "Robot Fabrikası", "base": {"metal": 400, "crystal": 120, "deuterium": 200}, "factor": 2.0},
    "shipyard": {"label": "Tersane", "base": {"metal": 400, "crystal": 200, "deuterium": 100}, "factor": 2.0},
    "research_lab": {"label": "Araştırma Lab", "base": {"metal": 200, "crystal": 400, "deuterium": 200}, "factor": 1.8},
}

RESEARCH: Dict[str, Dict[str, object]] = {
    "weapons": {"label": "Silah Teknolojisi", "base": {"metal": 800, "crystal": 200, "deuterium": 0}, "factor": 1.7},
    "shielding": {"label": "Kalkan Teknolojisi", "base": {"metal": 200, "crystal": 600, "deuterium": 0}, "factor": 1.7},
    "armor": {"label": "Zırh Teknolojisi", "base": {"metal": 1000, "crystal": 0, "deuterium": 0}, "factor": 1.7},
    "combustion": {"label": "Yanma Motoru", "base": {"metal": 400, "crystal": 0, "deuterium": 600}, "factor": 1.6},
    "impulse": {"label": "İtki Motoru", "base": {"metal": 1200, "crystal": 400, "deuterium": 1000}, "factor": 1.8},
    "hyperspace": {"label": "Hiperspace Motoru", "base": {"metal": 4000, "crystal": 2000, "deuterium": 4000}, "factor": 2.0},
}

UNITS: Dict[str, Dict[str, object]] = {
    "light_fighter": {
        "label": "Hafif Avcı",
        "cost": {"metal": 3000, "crystal": 1000, "deuterium": 0},
        "attack": 50,
        "hp": 400,
        "cargo": 50,
    },
    "heavy_fighter": {
        "label": "Ağır Avcı",
        "cost": {"metal": 6000, "crystal": 4000, "deuterium": 0},
        "attack": 150,
        "hp": 1000,
        "cargo": 100,
    },
    "cruiser": {
        "label": "Kruvazör",
        "cost": {"metal": 20000, "crystal": 7000, "deuterium": 2000},
        "attack": 400,
        "hp": 2700,
        "cargo": 800,
    },
    "battleship": {
        "label": "Savaş Gemisi",
        "cost": {"metal": 45000, "crystal": 15000, "deuterium": 0},
        "attack": 1000,
        "hp": 6000,
        "cargo": 1500,
    },
    "bomber": {
        "label": "Bombardıman Gemisi",
        "cost": {"metal": 50000, "crystal": 25000, "deuterium": 15000},
        "attack": 2500,
        "hp": 7500,
        "cargo": 500,
    },
    "destroyer": {
        "label": "Yokedici",
        "cost": {"metal": 60000, "crystal": 50000, "deuterium": 15000},
        "attack": 2000,
        "hp": 11000,
        "cargo": 2000,
    },
    "small_cargo": {
        "label": "Küçük Nakliye",
        "cost": {"metal": 2000, "crystal": 2000, "deuterium": 0},
        "attack": 10,
        "hp": 400,
        "cargo": 5000,
    },
    "large_cargo": {
        "label": "Büyük Nakliye",
        "cost": {"metal": 6000, "crystal": 6000, "deuterium": 0},
        "attack": 50,
        "hp": 1200,
        "cargo": 25000,
    },
}

DEFENSES: Dict[str, Dict[str, object]] = {
    "rocket_launcher": {"label": "Roketatar", "cost": {"metal": 2000, "crystal": 0, "deuterium": 0}, "attack": 80, "hp": 200},
    "light_laser": {"label": "Hafif Lazer", "cost": {"metal": 1500, "crystal": 500, "deuterium": 0}, "attack": 100, "hp": 200},
    "heavy_laser": {"label": "Ağır Lazer", "cost": {"metal": 6000, "crystal": 2000, "deuterium": 0}, "attack": 250, "hp": 800},
    "gauss": {"label": "Gauss Topu", "cost": {"metal": 20000, "crystal": 15000, "deuterium": 2000}, "attack": 1100, "hp": 3500},
    "plasma": {"label": "Plazma Taret", "cost": {"metal": 50000, "crystal": 50000, "deuterium": 30000}, "attack": 3000, "hp": 10000},
}


def scaled_cost(base: Dict[str, int], factor: float, level: int) -> Dict[str, int]:
    return {r: int(base[r] * (factor ** level)) for r in RES}


@dataclass
class Empire:
    id: int
    name: str
    is_bot: bool
    research: Dict[str, int] = field(default_factory=lambda: {k: 0 for k in RESEARCH})


@dataclass
class Planet:
    name: str
    coords: Tuple[int, int, int]
    owner_id: int
    buildings: Dict[str, int] = field(default_factory=lambda: {k: 1 for k in BUILDINGS})
    resources: Dict[str, int] = field(default_factory=lambda: {"metal": 10000, "crystal": 7000, "deuterium": 5000})
    ships: Dict[str, int] = field(default_factory=lambda: {k: 0 for k in UNITS})
    defenses: Dict[str, int] = field(default_factory=lambda: {k: 0 for k in DEFENSES})

    def economy_tick(self) -> None:
        mm = self.buildings["metal_mine"]
        cm = self.buildings["crystal_mine"]
        ds = self.buildings["deut_synth"]
        sp = self.buildings["solar_plant"]

        energy = 25 * (sp ** 1.2)
        used = 10 * mm + 10 * cm + 20 * ds
        ratio = max(0.3, min(1.0, energy / max(1, used)))

        self.resources["metal"] += int(35 * (mm ** 1.18) * ratio)
        self.resources["crystal"] += int(24 * (cm ** 1.18) * ratio)
        self.resources["deuterium"] += int(16 * (ds ** 1.16) * ratio)

    def power(self, weapon_bonus: float = 1.0, shield_bonus: float = 1.0, armor_bonus: float = 1.0) -> float:
        fleet_attack = sum(self.ships[u] * int(UNITS[u]["attack"]) for u in UNITS)
        fleet_hp = sum(self.ships[u] * int(UNITS[u]["hp"]) for u in UNITS)
        def_attack = sum(self.defenses[d] * int(DEFENSES[d]["attack"]) for d in DEFENSES)
        def_hp = sum(self.defenses[d] * int(DEFENSES[d]["hp"]) for d in DEFENSES)

        atk = (fleet_attack + def_attack) * weapon_bonus
        hp = (fleet_hp + def_hp) * armor_bonus * (0.75 + 0.25 * shield_bonus)
        return atk + hp * 0.22

    def cargo_capacity(self) -> int:
        return sum(self.ships[u] * int(UNITS[u]["cargo"]) for u in UNITS)


class GalaxyGame:
    def __init__(self, seed: Optional[int] = None, bot_count: int = 60) -> None:
        self.rng = random.Random(seed)
        self.turn = 1
        self.empires: List[Empire] = [Empire(id=0, name="Komutan", is_bot=False)]
        for i in range(1, bot_count + 1):
            self.empires.append(Empire(id=i, name=f"Yapay-Beyin-{i:03d}", is_bot=True))

        self.planets: List[Planet] = []
        self._generate_world()

    def _generate_world(self) -> None:
        star_names = [
            "Andara", "Vesper", "Nereid", "Orpheon", "Krypton", "Altair", "Nimera", "Bellatrix", "Cygnus", "Erebus",
            "Aster", "Tarsis", "Draconia", "Rigel", "Aquila", "Nebira", "Solis", "Talos", "Zenara", "Hyperion",
            "Mira", "Vortex", "Sidera", "Volaris", "Lyris", "Ravian", "Caligo", "Arcton", "Noxis", "Pulsar",
        ]

        def random_coords() -> Tuple[int, int, int]:
            return (self.rng.randint(1, 9), self.rng.randint(1, 499), self.rng.randint(1, 15))

        for emp in self.empires:
            p = Planet(name=self.rng.choice(star_names) + f"-{emp.id}", coords=random_coords(), owner_id=emp.id)
            p.ships["light_fighter"] = 15
            p.ships["small_cargo"] = 8
            p.ships["cruiser"] = 2
            p.defenses["rocket_launcher"] = 12
            self.planets.append(p)

        neutral_count = len(self.empires) * 4
        for i in range(neutral_count):
            p = Planet(name=self.rng.choice(star_names) + f"-N{i}", coords=random_coords(), owner_id=-1)
            p.resources = {
                "metal": self.rng.randint(10_000, 80_000),
                "crystal": self.rng.randint(8_000, 50_000),
                "deuterium": self.rng.randint(5_000, 35_000),
            }
            p.ships["light_fighter"] = self.rng.randint(0, 25)
            p.ships["heavy_fighter"] = self.rng.randint(0, 8)
            p.ships["cruiser"] = self.rng.randint(0, 4)
            p.defenses["rocket_launcher"] = self.rng.randint(0, 20)
            p.defenses["light_laser"] = self.rng.randint(0, 12)
            self.planets.append(p)

    def empire_planets(self, empire_id: int) -> List[Planet]:
        return [p for p in self.planets if p.owner_id == empire_id]

    def can_afford(self, pool: Dict[str, int], cost: Dict[str, int]) -> bool:
        return all(pool[r] >= cost[r] for r in RES)

    def pay(self, pool: Dict[str, int], cost: Dict[str, int]) -> bool:
        if not self.can_afford(pool, cost):
            return False
        for r in RES:
            pool[r] -= cost[r]
        return True

    def tech_multipliers(self, empire_id: int) -> Tuple[float, float, float]:
        r = self.empires[empire_id].research
        return 1 + 0.1 * r["weapons"], 1 + 0.1 * r["shielding"], 1 + 0.1 * r["armor"]

    def header(self) -> str:
        return (
            f"{C['title']}✦✦✦ GALAKSİ FATİHİ ONLINE // OFFLINE KOMUTA PANELİ ✦✦✦{C['reset']}\n"
            f"{C['star']}Turn {self.turn} | Aktif İmparatorluklar: {len([e for e in self.empires if self.empire_planets(e.id)])}{C['reset']}"
        )

    def summary_table(self, limit: int = 15) -> str:
        rows = []
        for e in self.empires:
            ps = self.empire_planets(e.id)
            if not ps:
                continue
            w, s, a = self.tech_multipliers(e.id)
            score = int(sum(p.power(w, s, a) for p in ps) + sum(sum(p.resources.values()) for p in ps) / 40)
            rows.append((score, e.name, len(ps)))
        rows.sort(reverse=True)

        out = ["\nSıralama (ilk 15):"]
        for i, (score, name, pcount) in enumerate(rows[:limit], 1):
            out.append(f"  {i:>2}. {name:<18} Gezegen:{pcount:<3} Güç:{score}")
        return "\n".join(out)

    def player_panel(self) -> str:
        mine = self.empire_planets(0)
        if not mine:
            return f"{C['danger']}İmparatorluğun yıkıldı.{C['reset']}"
        lines = ["\nGezegenlerin:"]
        for i, p in enumerate(mine):
            g, s, sl = p.coords
            lines.append(
                f" [{i}] {p.name:<16} [{g}:{s}:{sl}] M:{p.resources['metal']} C:{p.resources['crystal']} D:{p.resources['deuterium']}"
            )
            lines.append(
                f"      Bina M/C/D/S:{p.buildings['metal_mine']}/{p.buildings['crystal_mine']}/{p.buildings['deut_synth']}/{p.buildings['solar_plant']}"
                f" | Tersane:{p.buildings['shipyard']} Sav Roket:{p.defenses['rocket_launcher']} L.Laser:{p.defenses['light_laser']}"
            )
        return "\n".join(lines)

    def show(self) -> None:
        print("\n" + self.header())
        print(self.summary_table())
        print(self.player_panel())

    def ask_index(self, prompt: str, size: int) -> Optional[int]:
        try:
            x = input(f"{prompt} [0-{size - 1}] (boş=iptal): ").strip()
            if not x:
                return None
            v = int(x)
            return v if 0 <= v < size else None
        except ValueError:
            return None

    def player_turn(self) -> None:
        while True:
            self.show()
            print("\nKomutlar: [1] Bina yükselt [2] Araştırma [3] Gemi üret [4] Savunma üret [5] Saldır [6] Turu bitir")
            cmd = input("Seçim> ").strip()
            if cmd == "6":
                return
            if cmd == "1":
                self.player_upgrade_building()
            elif cmd == "2":
                self.player_research()
            elif cmd == "3":
                self.player_build_unit()
            elif cmd == "4":
                self.player_build_defense()
            elif cmd == "5":
                self.player_attack()
            else:
                print(f"{C['warn']}Geçersiz komut.{C['reset']}")

    def player_upgrade_building(self) -> None:
        ps = self.empire_planets(0)
        idx = self.ask_index("Gezegen seç", len(ps)) if ps else None
        if idx is None:
            return
        p = ps[idx]
        keys = list(BUILDINGS)
        for i, k in enumerate(keys):
            lvl = p.buildings[k]
            c = scaled_cost(BUILDINGS[k]["base"], float(BUILDINGS[k]["factor"]), lvl)
            print(f" [{i}] {BUILDINGS[k]['label']:<24} Lv:{lvl:<2} M:{c['metal']} C:{c['crystal']} D:{c['deuterium']}")
        kidx = self.ask_index("Bina", len(keys))
        if kidx is None:
            return
        b = keys[kidx]
        cost = scaled_cost(BUILDINGS[b]["base"], float(BUILDINGS[b]["factor"]), p.buildings[b])
        if self.pay(p.resources, cost):
            p.buildings[b] += 1
            print(f"{C['ok']}Yükseltildi: {BUILDINGS[b]['label']}.{C['reset']}")
        else:
            print(f"{C['danger']}Kaynak yetmedi.{C['reset']}")

    def player_research(self) -> None:
        ps = self.empire_planets(0)
        if not ps:
            return
        home = ps[0]
        keys = list(RESEARCH)
        er = self.empires[0].research
        for i, k in enumerate(keys):
            lv = er[k]
            c = scaled_cost(RESEARCH[k]["base"], float(RESEARCH[k]["factor"]), lv)
            print(f" [{i}] {RESEARCH[k]['label']:<24} Lv:{lv:<2} M:{c['metal']} C:{c['crystal']} D:{c['deuterium']}")
        ridx = self.ask_index("Araştırma", len(keys))
        if ridx is None:
            return
        rk = keys[ridx]
        if home.buildings["research_lab"] < 2:
            print(f"{C['warn']}En az Araştırma Lab seviyesi 2 gerekli.{C['reset']}")
            return
        cost = scaled_cost(RESEARCH[rk]["base"], float(RESEARCH[rk]["factor"]), er[rk])
        if self.pay(home.resources, cost):
            er[rk] += 1
            print(f"{C['ok']}Araştırma tamamlandı: {RESEARCH[rk]['label']}.{C['reset']}")
        else:
            print(f"{C['danger']}Kaynak yetmedi.{C['reset']}")

    def player_build_unit(self) -> None:
        ps = self.empire_planets(0)
        idx = self.ask_index("Gezegen", len(ps)) if ps else None
        if idx is None:
            return
        p = ps[idx]
        keys = list(UNITS)
        for i, u in enumerate(keys):
            c = UNITS[u]["cost"]
            print(f" [{i}] {UNITS[u]['label']:<20} M:{c['metal']} C:{c['crystal']} D:{c['deuterium']} Mevcut:{p.ships[u]}")
        uidx = self.ask_index("Ünite", len(keys))
        if uidx is None:
            return
        unit = keys[uidx]
        try:
            amount = int(input("Adet: ").strip())
            if amount <= 0:
                raise ValueError
        except ValueError:
            print("Hatalı adet.")
            return
        if p.buildings["shipyard"] < 2:
            print("Tersane en az seviye 2 olmalı.")
            return
        total = {r: int(UNITS[unit]["cost"][r]) * amount for r in RES}
        if self.pay(p.resources, total):
            p.ships[unit] += amount
            print(f"{amount} {UNITS[unit]['label']} üretildi.")
        else:
            print("Kaynak yetersiz.")

    def player_build_defense(self) -> None:
        ps = self.empire_planets(0)
        idx = self.ask_index("Gezegen", len(ps)) if ps else None
        if idx is None:
            return
        p = ps[idx]
        keys = list(DEFENSES)
        for i, d in enumerate(keys):
            c = DEFENSES[d]["cost"]
            print(f" [{i}] {DEFENSES[d]['label']:<20} M:{c['metal']} C:{c['crystal']} D:{c['deuterium']} Mevcut:{p.defenses[d]}")
        didx = self.ask_index("Savunma", len(keys))
        if didx is None:
            return
        d = keys[didx]
        try:
            amount = int(input("Adet: ").strip())
            if amount <= 0:
                raise ValueError
        except ValueError:
            print("Hatalı adet.")
            return
        total = {r: int(DEFENSES[d]["cost"][r]) * amount for r in RES}
        if self.pay(p.resources, total):
            p.defenses[d] += amount
            print(f"{amount} adet {DEFENSES[d]['label']} kuruldu.")
        else:
            print("Kaynak yetersiz.")

    def list_targets(self) -> List[Planet]:
        targets = [p for p in self.planets if p.owner_id != 0]
        targets.sort(key=lambda p: (p.owner_id == -1, sum(p.resources.values())), reverse=True)
        return targets

    def player_attack(self) -> None:
        mine = self.empire_planets(0)
        sidx = self.ask_index("Saldıran gezegen", len(mine)) if mine else None
        if sidx is None:
            return
        source = mine[sidx]

        targets = self.list_targets()
        show = targets[:25]
        for i, t in enumerate(show):
            owner = "Nötr" if t.owner_id == -1 else self.empires[t.owner_id].name
            g, s, sl = t.coords
            ew, es, ea = self.tech_multipliers(max(t.owner_id, 0)) if t.owner_id >= 0 else (1.0, 1.0, 1.0)
            print(f" [{i:>2}] {t.name:<14} [{g}:{s}:{sl}] Sahip:{owner:<18} Güç:{int(t.power(ew, es, ea))}")
        tidx = self.ask_index("Hedef", len(show))
        if tidx is None:
            return
        self.resolve_battle(source, show[tidx], 0)

    def resolve_battle(self, source: Planet, target: Planet, attacker_id: int) -> bool:
        if source.owner_id != attacker_id:
            return False
        sent_ships = {}
        for k, count in source.ships.items():
            sent = math.floor(count * 0.7)
            sent_ships[k] = sent
            source.ships[k] -= sent
        if sum(sent_ships.values()) == 0:
            return False

        aw, as_, aa = self.tech_multipliers(attacker_id)
        if target.owner_id >= 0:
            dw, ds, da = self.tech_multipliers(target.owner_id)
        else:
            dw, ds, da = (1.0, 1.0, 1.0)

        atk = sum(sent_ships[u] * int(UNITS[u]["attack"]) for u in UNITS) * aw
        atk_hp = sum(sent_ships[u] * int(UNITS[u]["hp"]) for u in UNITS) * aa
        def_pow = target.power(dw, ds, da)

        win_prob = (atk + atk_hp * 0.15) / ((atk + atk_hp * 0.15) + def_pow + 1)
        win = self.rng.random() < win_prob

        if win:
            survive = 0.35 + win_prob * 0.45
            for u in UNITS:
                source.ships[u] += int(sent_ships[u] * survive)

            cargo = int(sum(sent_ships[u] * int(UNITS[u]["cargo"]) for u in UNITS) * survive)
            max_loot = min(cargo, int(sum(target.resources.values()) * (0.25 + 0.25 * win_prob)))
            loot_m = min(target.resources["metal"], max_loot // 2)
            loot_c = min(target.resources["crystal"], (max_loot - loot_m) // 2)
            loot_d = min(target.resources["deuterium"], max_loot - loot_m - loot_c)
            loot = {"metal": loot_m, "crystal": loot_c, "deuterium": loot_d}
            for r in RES:
                target.resources[r] -= loot[r]
                source.resources[r] += loot[r]

            if self.rng.random() < 0.5:
                target.owner_id = attacker_id
                target.ships = {k: int(v * 0.2) for k, v in target.ships.items()}
                target.defenses = {k: int(v * 0.35) for k, v in target.defenses.items()}

            if attacker_id == 0:
                print(f"{C['ok']}Saldırı başarılı! Yağma: {loot}{C['reset']}")
            return True

        target.ships = {k: int(v * 0.92) for k, v in target.ships.items()}
        target.defenses = {k: int(v * 0.97) for k, v in target.defenses.items()}
        if attacker_id == 0:
            print(f"{C['danger']}Saldırı geri püskürtüldü.{C['reset']}")
        return False

    def bot_upgrade_logic(self, empire: Empire, planet: Planet) -> None:
        # ekonomi odaklı büyüme
        eco_order = ["metal_mine", "crystal_mine", "solar_plant", "deut_synth", "shipyard", "research_lab"]
        self.rng.shuffle(eco_order)
        for b in eco_order:
            cost = scaled_cost(BUILDINGS[b]["base"], float(BUILDINGS[b]["factor"]), planet.buildings[b])
            if self.can_afford(planet.resources, cost) and self.rng.random() < 0.55:
                self.pay(planet.resources, cost)
                planet.buildings[b] += 1
                break

        # savunma/filo üretim
        for _ in range(2):
            if self.rng.random() < 0.55:
                u = self.rng.choice(list(UNITS))
                amount = self.rng.randint(1, 4)
                total = {r: int(UNITS[u]["cost"][r]) * amount for r in RES}
                if self.can_afford(planet.resources, total):
                    self.pay(planet.resources, total)
                    planet.ships[u] += amount
            else:
                d = self.rng.choice(list(DEFENSES))
                amount = self.rng.randint(1, 3)
                total = {r: int(DEFENSES[d]["cost"][r]) * amount for r in RES}
                if self.can_afford(planet.resources, total):
                    self.pay(planet.resources, total)
                    planet.defenses[d] += amount

        # araştırma
        if planet.buildings["research_lab"] >= 2 and self.rng.random() < 0.35:
            rk = self.rng.choice(list(RESEARCH))
            lv = empire.research[rk]
            cost = scaled_cost(RESEARCH[rk]["base"], float(RESEARCH[rk]["factor"]), lv)
            if self.can_afford(planet.resources, cost):
                self.pay(planet.resources, cost)
                empire.research[rk] += 1

    def bot_attack_logic(self, empire: Empire, source: Planet) -> None:
        aw, as_, aa = self.tech_multipliers(empire.id)
        source_pow = source.power(aw, as_, aa)
        if source_pow < 2000:
            return

        targets = [p for p in self.planets if p.owner_id != empire.id]
        self.rng.shuffle(targets)
        targets = sorted(targets[:25], key=lambda t: sum(t.resources.values()) / max(1, t.power()))

        for t in targets:
            if t.owner_id >= 0:
                tw, ts, ta = self.tech_multipliers(t.owner_id)
                tpow = t.power(tw, ts, ta)
            else:
                tpow = t.power()
            if source_pow > tpow * (1.25 + self.rng.random() * 0.35):
                self.resolve_battle(source, t, empire.id)
                break

    def advance_turn(self) -> None:
        for p in self.planets:
            p.economy_tick()

        for e in self.empires:
            if not e.is_bot:
                continue
            ps = self.empire_planets(e.id)
            if not ps:
                continue
            for p in ps:
                self.bot_upgrade_logic(e, p)
                if self.rng.random() < 0.32:
                    self.bot_attack_logic(e, p)

        self.turn += 1

    def game_over(self) -> bool:
        alive = [e.id for e in self.empires if self.empire_planets(e.id)]
        return 0 not in alive or len(alive) <= 1

    def winner(self) -> str:
        alive = [e for e in self.empires if self.empire_planets(e.id)]
        if not alive:
            return "Hiç kimse"
        alive.sort(key=lambda e: len(self.empire_planets(e.id)), reverse=True)
        return alive[0].name


def main() -> None:
    print(f"{C['title']}Galaksi Fatihi Online (Offline) başlatılıyor...{C['reset']}")
    seed_text = input("Seed (boş=rastgele): ").strip()
    seed = int(seed_text) if seed_text else None

    bots_text = input("Bot sayısı (10-300, öneri 80): ").strip() or "80"
    try:
        bots = max(10, min(300, int(bots_text)))
    except ValueError:
        bots = 80

    game = GalaxyGame(seed=seed, bot_count=bots)

    while not game.game_over() and game.turn <= 250:
        if not game.empire_planets(0):
            break
        game.player_turn()
        game.advance_turn()

    print(f"\n{C['title']}=== OYUN BİTTİ ==={C['reset']}")
    print(f"Kazanan: {game.winner()}")


if __name__ == "__main__":
    main()
