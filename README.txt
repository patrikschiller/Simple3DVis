# Dokumentace #
- Název Projektu: Aplikace pro zobrazování 3D modelů (ThreeDee)
- Zpracoval: Patrik Schiller, 2020


- Popis funkcionality tříd a metod je popsán v kódu (doxygen)
    - Kód je dostupný zde: https://gitlab.fel.cvut.cz/schilpat/covid-kaj/-/tree/Semestralka
    - Stránka zde: http://patrikschiller.com/KAJ/
- Ovládání je popsáno v podstránce 'Model Visualizer' (ovládání pomocí WASD, Space, Levý Shift, myš).
- Interakce se scénou je umožněna až po kliknutí myší do scény.
- Pomocí klávesy F je možné zapnout Fullscreen aplikace (klávesou F nebo Escape je možné fullscreen vypnout)
- Některé assety (složka assets/) pochází ještě z udemy tutoriálu, podle kterého jsem se učil THREE.js (nejsou mé), hrad je z mé tvorby

- Logo stránky (kostička) je tvořeno třemi DIVy transformovanými pomocí 3D matice

#= Soubory =#
- root/
   |- index.html                         |- Hlavní HTML soubor
   |- index.css                          |- Hlavní CSS soubor
   |- hrad/                              |- Složka s modelem hradu
   |- js/
   |----|- index.js                      |- Hlavní JS skript (modul)
        |- utils/
        |---|- ModelVisualizer.class.js  |- Třída reprezentující stránku 'Model visualizer' (interaktivní 3D scénu s modelem hradu a skyboxem)
        |   |- ModelLoader.class.js      |- Třída reprezentující scénu s možností nahrávání modelů (stránka 'FBX loader')
        |   |- Helper.class.js           |- Pomocná třída se statickými metodami
        |
        |- libs/                         |- Složka s pomocnými knihovnami (THREE.js)
        |- assets/                       |- Složka s ostatními modely a texturami