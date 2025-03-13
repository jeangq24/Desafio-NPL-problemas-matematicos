# Desafío NPL - Problemas Matemáticos

## 📌 ¿En qué consiste el desafío?
Cuando estés list@, tendrás que resolver una secuencia de problemas durante **3 minutos**.  
Obtendrás y responderás los problemas a través de una **API**.  

Cada problema está planteado en **lenguaje natural**, y su solución es un número que debes calcular a partir de los atributos de diferentes objetos.

## 🔹 Tipos de objetos
Los objetos pueden ser de **tres tipos**:

- 🌍 **Planetas de Star Wars**
- 🧑‍🚀 **Personajes de Star Wars**
- 🐹 **Pokémon**

Cada uno de estos objetos tiene atributos específicos que puedes consultar en las siguientes APIs:

- [PokéAPI](https://pokeapi.co/)
- [SWAPI - Star Wars API](https://swapi.dev/)

---

## 📦 Esquema de datos
Los objetos tienen múltiples atributos. Para esta tarea, necesitarás los siguientes:

### **StarWarsPlanet**
```json
{
  "name": "Tatooine",
  "rotation_period": 23,
  "orbital_period": 304,
  "diameter": 10465,
  "surface_water": 1,
  "population": 200000
}

{
  "name": "Luke Skywalker",
  "height": 172,
  "mass": 77,
  "homeworld": "Tatooine"
}

{
  "name": "Vulpix",
  "base_experience": 60,
  "height": 6,
  "weight": 99
}
```

🧩 Ejemplo de problema
En una galaxia muy, muy lejana, Luke Skywalker se encuentra en el planeta Tatooine, donde ha decidido entrenar a su nuevo compañero Pokémon, Vulpix.

Mientras Luke mueve su sable de luz, se pregunta cuánta experiencia ganará al entrenar con Vulpix si su masa es multiplicada por la experiencia base que este Pokémon puede alcanzar.

¿Qué tan poderoso se volverá Luke con la ayuda de su amigo Pokémon?

Este enunciado se puede traducir en la siguiente expresión matemática:

```js
luke.mass * vulpix.base_experience
```

```js
77 * 60 = 4620
```


Ejemplo 2
📍 En el remoto planeta de Utapau, donde los vientos susurran secretos antiguos, Swalot, un Pokémon de gran experiencia, decide embarcarse en un enigma matemático.

Comienza sumando su base de experiencia al resultado de dividir el período orbital de Utapau por el peso del feroz Carvanha. Pero la curiosidad de Swalot no se detiene ahí, pues decide añadir el imponente diámetro del planeta Kalee al resultado obtenido.

Expresión matemática:

```js
swalot.base_experience + (utapau.orbital_period / carvanha.weight) + kalee.diameter
```
Ejemplo 3
📍 En una galaxia lejana, Steelix, el imponente Pokémon de tipo acero, decide embarcarse en una aventura matemática junto a Doduo, el veloz Pokémon de dos cabezas.

Juntos, calculan el producto de la altura de Steelix y el peso de Doduo. Intrigados por el universo, dividen este resultado por la masa del valiente capitán Raymus Antilles. Pero la travesía no termina ahí, pues deciden restar la majestuosa altura de Solgaleo, el legendario Pokémon que brilla como el sol.

Expresión matemática:

```js
(steelix.height * doduo.weight) / raymus_antilles.mass - solgaleo.height
```
Ejemplo 4
📍 En el pacífico planeta de Chandrila, conocido por su armonioso entorno, Jar Jar Binks, el gungan más torpe de la galaxia, decide embarcarse en una aventura matemática.

Primero, multiplica el período de rotación de Chandrila por su propia altura. Con este resultado en mano, Jar Jar se dirige al árido planeta Geonosis para calcular cuántas veces el diámetro de Geonosis cabe en su producto anterior.

Finalmente, para completar su enigma, resta la altura de Toucannon, el colorido Pokémon volador, del resultado obtenido.

Expresión matemática:

```js
(jar_jar_binks.height * chandrila.rotation_period) / geonosis.diameter - toucannon.height
```
Ejemplo 5
📍 En el majestuoso planeta de Muunilinst, conocido por sus vastos paisajes y su importancia en la economía galáctica, Padmé Amidala, la valiente senadora de Naboo, se embarca en una misión diplomática.

Durante su estancia, decide realizar un curioso cálculo: suma su propia altura al impresionante diámetro del planeta Muunilinst.

Expresión matemática:

```js
padme_amidala.height + muunilinst.diameter
```