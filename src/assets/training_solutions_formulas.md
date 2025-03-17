# Fórmulas Utilizadas en las Soluciones de Entrenamiento

Este documento complementa el diagrama de flujo y la matriz CSV, proporcionando detalles sobre las fórmulas matemáticas utilizadas para calcular los diferentes índices y valores que determinan las soluciones de entrenamiento.

## Elastic Contribution Ratio (ECR)

El ECR mide la contribución del componente elástico al salto, comparando el salto con contramovimiento (CMJ) con el Squat Jump (SJ).

**Fórmula:**

```
ECR = ((CMJ - SJ) / SJ) * 100
```

Donde:

- CMJ = Altura alcanzada en el salto con contramovimiento (cm)
- SJ = Altura alcanzada en el Squat Jump (cm)
- ECR = Porcentaje de contribución elástica

**Interpretación:**

- ECR < 10%: Baja contribución elástica
- ECR entre 10% y 20%: Contribución elástica moderada
- ECR > 20%: Alta contribución elástica

## Contribución de Brazos

Mide cuánto contribuye el movimiento de los brazos al salto, comparando el salto Abalakov (con brazos) con el CMJ (sin brazos).

**Fórmula:**

```
Contribución de Brazos = ((Abalakov - CMJ) / CMJ) * 100
```

Donde:

- Abalakov = Altura alcanzada en el salto Abalakov (cm)
- CMJ = Altura alcanzada en el salto con contramovimiento (cm)
- Contribución de Brazos = Porcentaje de contribución del movimiento de brazos

**Interpretación:**

- Contribución <= 10%: Bajo Nivel de coordinación de brazos (se espera una contribución de 10-15%)

## Reactive Strength Index (RSI)

El RSI mide la capacidad de fuerza reactiva, calculada a partir de los resultados de pruebas de saltos múltiples.

**Fórmula principal:**

```
RSI = Tiempo de Vuelo / Tiempo de Contacto con el Suelo
```

**Métodos alternativos de cálculo (cuando los datos principales no están disponibles):**

1. Usando el tiempo de vuelo máximo y su correspondiente tiempo de contacto
2. Usando promedios de tiempo de vuelo y tiempo de contacto
3. Usando métricas de rigidez y rendimiento como aproximación

**Interpretación:**

- RSI < 1: Muy bajo índice de fuerza reactiva
- RSI entre 1 y 1.5: Bajo índice de fuerza reactiva
- RSI entre 1.5 y 2: Moderado índice de fuerza reactiva
- RSI entre 2 y 2.5: Buen índice de fuerza reactiva
- RSI entre 2.5 y 3: Alto nivel de fuerza reactiva
- RSI > 3: Nivel de fuerza reactiva clase mundial

## Comparación Drop Jump vs CMJ

Esta comparación determina si el atleta puede elevar su centro de gravedad con su salto hasta la altura de caída óptima del drop jump.

**Comparación:**

```
¿Drop Jump Height > CMJ Height?
```

**Interpretación:**

- Si Drop Jump > CMJ: Entrenar con drop jump
- Si Drop Jump <= CMJ: Entrenar con vallas
