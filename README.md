# Disclaimer

Aplicatia foloseste la baza calculelor functia `eval` din javascript. Programul este conceput doar pentru expresii numerice. Valorile introduse de catre utilizator si efectele produse sunt doar sub responsabilitatea utilizatorului.

**NU** introduceti valori precum, dar a nu se limita la, expresii copiate, expressi care reprezinta cod obfuscat, sau orice alta expresie necunoscuta care poate provoca daune asupra deviceului.

# Ce este?

Un transpiler + un calculator in care poti declara, vizualiza variabile, si folosi variabile in expresii numerice.

Aplicatia a fost testata si conceputa doar pe Windows 11.

# Cum se foloseste?

Dupa instalare, programul se afiseaza/ascunde cu `Alt+Space`.

Puteti tasta `/ajutor` pentru a vizualiza toate comenzile valabile alaturi de explicatiile lor.

Puteti tasta orice expresie numerica pentru a fi evaluata (calculata). Ex: `1 + 1` `(5000*21)/121`

Puteti apasa tasta `Enter` pentru a copia valoarea finala afisata pe ecran dupa o evaluare de succes.

# Interfata

Aplicatia este gandita sa ruleze in background.

Interfata este conceputa din 2 popup-uri, astfel:

- Popup-ul principal: este afisat in mijlocul ecranului si contine calculatorul principal. Acesta este afisat/ascuns cu <Alt+Space>, este ascuns cu <Esc> sau <Enter> daca cursorul se afla in casuta de text principala. Popupul principal **NU** se inchide la un click in afara continutului principal (nu se inchide "on blur").
- Popup-ul secundar unde sunt afisate variabilele declarate: Acesta va aparea doar atunci cand exista minim 1 variabila declarata. Acesta poate fi ascuns/afisat prin tastarea comenzii `/t` in casuta principala sau prin stergerea tuturor variabilelor.

# Variabile

Variabilele pot avea 2 moduri de evaluare, respectiv:

- `static` sau `s`: caz in care valoarea static evaluata la declaratie va fi folosita la orice referinta si nu va fi implicit modificata (poate fi modificata doar explicit prin declaratia unei voi valori).
- `dinamic` sau `d`: caz in care expresia care sta la baza valorii statice evaluate la declaratie va fi reevaluata la fiecare referinta. Variabila poate fi implicit modificata prin modificarea altor variabile care stau la baza expresiei principale.

Ex:

```
<Alt+Space>

x = 2; #y = x + 4; y
=> E = 6

<Enter>
<Alt+Space>

x = 20;
y

=> E = 24

<Enter>
```

Puteti declara o variabila statica in urmatorul mod: `[X] = [EXP]`, unde `[X]` este orice sir alfanumeric, **incepand cu o litera**, iar `[EXP]` este expresia numerica sau expresia dinamica (o expresie numerica cu variabile), a carei valori evaluate va fi atasata variabilei declarate.

Variabilele dinamice sunt declarate in acelasi mod, insa declaratia incepe cu simbolul `#` astfel: `#[X] = [EXP]`.

Pe langa modurile de evaluare, exista 2 tipuri de variabile, respectiv:

- Variabile normale: declaratie normala, fara niciun simbol specific
- Variabile speciale: declarate cu simbolul `!` inaintea valorii variabilei, astfel: `[X] = ![EXP]` sau `#[X] = ![EXP]`

Aceste 2 tipuri exista pentru a adauga un nivel de ordonare atunci cand trebuie sa pastrati doar variabilele folositoare intr-o anumita sesiune, sau cand trebuie sa diferentiati variabilele folosite la calcul si variabilele salvate doar pentru referinta (doar pentru a fi afisate pe ecran).

Referinta la o variabila se poate face fara simboluri speciale, doar denumirea alfanumerica (incepand cu o litera) a variabilei.

# Cum se instaleaza?

Prin installerul atasat in pagina [`releases`](https://github.com/Meriegg/calculator-contabilitate/releases/tag/installer).

Prin crearea propriului installer. Dupa clonarea aplicatiei, se vor rula urmatoarele comenzi (reqs: pnpm):

`pnpm install`

apoi

`pnpm run dist`

Installerul alaturi de fisierul executabil se vor afla in folderul `/release`

# Enjoy
