## Zap application scanner


Skrypty do skanowania naszych aplikacji poprzez ZED ATTACK PROXY

  - scan.js - Komunikacja z zapem poprzez api (domyślnie localhost:8080)
  - compare.js - porównanie logów skanowania przed / po zmianie

#### Pierwsze uruchomienie zapa
Aby nasz skrypt mógł komunikować się z api zap'a , należy w tools->options->api
zaznaczyć checkbox disable api key
(do poprawnia -security)

#### Testowana aplikacja w stanie przed wprowadzeniem zmian

```sh
node scan.js nazwa-projektu url-projektu ktory-skan
```
  - nazwa-projektu jednoznacznie określa z której konfiguracji korzystamy - sekcje w `/config/default.js`
  - url-projektu domena pod krótą znajdziemy projekt
  - ktory-skan - określa czy skan będzie przed czy po zmianach w aplikacji (opcje - `one` / `two`)
  i w tym wypadku prawidłową jest one.

Powyższa komenda uruchomi skan `spider` zapa, wyniki zostaną zapisane w pliku
`/tmp/results-one.json`

#### Testowana aplikacja w stanie po wprowadzeniem zmian

```sh
node scan.js nazwa-projektu url-projektu two
```
Ponowne uruchomienia skanu na projekcie z wprowadzonymi zmianami, 
wyinki zapisane do pliku
`/tmp/results-two.json`

#### Porównanie wyników

```sh
node compare.js nazwa-projektu
```
Skrypt porównuje wyniki z działania obu skanów, i różnice zapisuje w `/results/results-from-DATE().json`

## Instalacja

Skrypty korzystają z kilku zależności, więc żeby zainstalować ręcznie

```sh
cd zap-application-scanner
npm install
```

## Dodanie aplikacji

    "nazwa-aplikacji" : {
        "target_url" : "/web/app.php",
        "protected_url" : "/admin",
        "login_handler" : "/login_check",
        "login_form" : "/login",
        "proxy_url" : "http://127.0.0.1",
        "proxy_port" : "8080",
        "username" : "test",
        "password" : "test",
        "logged_in_indicator" : "Wyloguj",
        "login_script" : "login-script",
        "ignored_codes" : ["200"],
        "depth" : 5
    }


  - `nazwa-aplikacji` - później jako parametr do wywołania skryptów aby było wiadomo który config załadować
  - `target_url` - url pod którym możemy uruchomić aplikację
  - `protected_url` - przykładowy url do zamkniętej ( wymagającej logowania ) części serwisu
  - `login_handler` - gdzie wysyłany jest request z danymi logowania
  - `login_form` - gdzie wysyłany jest request po formularz do logowania
  - `proxy_url` , `proxy_port` - ustawienia proxy zapa - powyżej domyślne
  - `username` , `password` - dane do zalogowania się do testowanej aplikacji
  - `login_script` - skrypt Zapa wykonujący logowanie, takie skrypty umieszczone są w katalogu `/scripts`
  - `ignored_codes` - jakich zwrotek nie porównujemy w skrypcie compare.js
  - `depth` - jak głęboko spider ma się zagłębiać w drzewo strony 