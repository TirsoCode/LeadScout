# MotoBlind — Game Design Document

## 1. Concepto General

**MotoBlind** es un endless runner en primera persona para navegador web (HTML5 + JavaScript). El jugador conduce una moto a través de una ciudad/carretera urbana a velocidad creciente, esquivando obstáculos y recogiendo monedas. Sin niveles, sin fin: sobrevive lo máximo posible y supera tu récord.

---

## 2. Respuestas del Brief

| Pregunta | Respuesta |
|---|---|
| Vehículo | Moto |
| Avance | Automático (endless runner) |
| Modo | Infinito (♾️) |
| Obstáculos | Barreras, túneles, cajas |
| Movimiento | Izquierda, derecha, saltar, agacharse |
| Coleccionables | Monedas |
| Power-ups | Ninguno |
| Escenario | Ciudad / carretera urbana |
| Puntuación | Sistema de puntos en tiempo real |
| Sonido | Sin audio (sólo visual) |
| Plataforma | Navegador web (HTML5) |

---

## 3. Mecánicas de Juego

### 3.1 Movimiento del jugador
- **← / A** → moverse a la izquierda (entre 3 carriles)
- **→ / D** → moverse a la derecha
- **↑ / W / Espacio** → saltar (para pasar por encima de cajas)
- **↓ / S** → agacharse (para pasar por debajo de barreras y túneles)

### 3.2 Velocidad
- La moto avanza sola a velocidad constante que **aumenta progresivamente** cada 30 segundos.
- La velocidad nunca decrece mientras la partida esté activa.

### 3.3 Carriles
- Existen **3 carriles** (izquierda, centro, derecha).
- El jugador cambia de carril instantáneamente al pulsar ← o →.

---

## 4. Obstáculos

| Obstáculo | Acción requerida | Aparición |
|---|---|---|
| **Caja** | Saltar (↑) | Suelo, cualquier carril |
| **Barrera metálica** | Agacharse (↓) | Altura media, cualquier carril |
| **Túnel bajo** | Agacharse (↓) | Ocupa todo el ancho o un carril |
| **Combinación** | Saltar + cambiar carril | Avanzado |

- Los obstáculos se generan de forma **procedural y aleatoria**.
- La densidad y velocidad aumentan con el tiempo.

---

## 5. Coleccionables

- **Monedas** → aparecen flotando en los carriles.
- Valor: **+10 puntos** cada una.
- Se recogen automáticamente al pasar por encima.

---

## 6. Sistema de Puntuación

```
Puntuación = (Tiempo sobrevivido × 1 punto/segundo) + (Monedas × 10 puntos)
```

- El marcador se muestra en tiempo real en la HUD.
- Al morir se muestra la **puntuación final**.
- Se guarda el **récord local** (localStorage del navegador).

---

## 7. Vista en Primera Persona

- La cámara está **montada en el manillar** de la moto.
- Se ve la carretera desde el punto de vista del conductor.
- El escenario incluye:
  - Edificios laterales desplazándose
  - Marcas de carril en el asfalto
  - Obstáculos aproximándose desde el fondo
  - Cielo urbano (nubes, farolas)

---

## 8. Escenario Visual

- **Ambientación**: ciudad / carretera urbana de día
- **Paleta visual**: asfalto gris, señales amarillas, edificios grises-azulados, monedas doradas
- **Perspectiva**: corredor de profundidad simulado con CSS 3D o Canvas 2D con proyección perspectiva
- Sin audio (demo neto).

---

## 9. Pantallas del Juego

### 9.1 Pantalla de Inicio
- Logo "MotoBlind"
- Botón **JUGAR**
- Récord guardado

### 9.2 HUD durante la partida
- Puntuación actual (arriba izquierda)
- Récord personal (arriba derecha)
- Velocidad actual (indicador visual)

### 9.3 Pantalla de Game Over
- "GAME OVER"
- Puntuación final
- Récord (si se superó, animación de nuevo récord)
- Botón **REINTENTAR**

---

## 10. Tecnología

| Componente | Tecnología |
|---|---|
| Renderizado | HTML5 Canvas (2D con perspectiva) |
| Lógica | JavaScript vanilla |
| Estilos HUD | CSS3 |
| Almacenamiento | localStorage (récord local) |
| Hosting | Cualquier servidor web estático |

---

## 11. Estructura de Archivos

```
motoblind/
├── index.html       ← Página principal
├── game.js          ← Lógica del juego (loop, física, colisiones)
├── renderer.js      ← Renderizado de la escena en Canvas
├── obstacles.js     ← Generación procedural de obstáculos
├── hud.js           ← HUD y pantallas (inicio, game over)
└── style.css        ← Estilos generales y fuentes
```

---

## 12. Fases de Desarrollo

| Fase | Contenido |
|---|---|
| **1 – Prototipo** | Carretera en perspectiva + movimiento de carriles + colisión básica |
| **2 – Obstáculos** | Cajas, barreras y túneles con generación aleatoria |
| **3 – Monedas** | Sistema de coleccionables y puntuación |
| **4 – Progresión** | Velocidad creciente + dificultad escalada |
| **5 – Pulido** | HUD, pantalla de inicio, Game Over, récord local |
| **6 – Deploy** | Publicar en servidor web / GitHub Pages |

---

## 13. Controles Rápidos (Referencia)

```
  ← A     →  D   →  Cambiar carril
  ↑ W  Espacio   →  Saltar
  ↓ S            →  Agacharse
```

---

*MotoBlind — Diseñado para navegador web. Sin descarga, sin instalación. Juega y supera tu récord.*
