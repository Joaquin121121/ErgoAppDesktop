# Documentación de Soluciones de Entrenamiento

Este directorio contiene archivos que documentan las diferentes soluciones de entrenamiento que se generan en base a los resultados de las pruebas de salto.

## Archivos Incluidos

1. **training_solutions_matrix.csv**: Matriz de todas las posibles soluciones de entrenamiento organizadas por tipo de comparación y rango de valores.
2. **training_solutions_flowchart.md**: Diagrama de flujo que muestra la lógica de decisión para determinar qué soluciones de entrenamiento se generan.
3. **training_solutions_formulas.md**: Documento que detalla las fórmulas matemáticas utilizadas para los cálculos de los diferentes índices y valores.

## Matriz de Soluciones de Entrenamiento (CSV)

El archivo CSV contiene las siguientes columnas:

- **Tipo de Comparación**: El tipo de comparación que se está realizando (ECR, Contribución de Brazos, RSI, Drop Jump vs CMJ)
- **Rango de Valores**: El rango de valores que determina qué solución se proporciona
- **Título**: El título de la solución de entrenamiento
- **Información**: Explicación detallada de por qué se recomienda esta solución
- **Tipo de Ejercicio**: Categoría general de ejercicios recomendados
- **Ejemplos de Ejercicios**: Ejemplos específicos de ejercicios recomendados

### Tipos de Comparación

1. **ECR (Elastic Contribution Ratio)**: Compara la altura del salto CMJ con la altura del salto Squat Jump para determinar la contribución elástica.

   - Fórmula: `((CMJ - SJ) / SJ) * 100`
   - Rangos: < 10%, 10-20%, > 20%

2. **Contribución de Brazos**: Compara la altura del salto Abalakov con la altura del salto CMJ para determinar la contribución de los brazos.

   - Fórmula: `((Abalakov - CMJ) / CMJ) * 100`
   - Rangos: <= 10%

3. **RSI (Reactive Strength Index)**: Evalúa la capacidad de fuerza reactiva basada en los resultados de pruebas de saltos múltiples.

   - Rangos: < 1, 1-1.5, 1.5-2, 2-2.5, 2.5-3, > 3

4. **Drop Jump vs CMJ**: Compara la altura del Drop Jump con la altura del CMJ.
   - Condiciones: Drop Jump > CMJ, Drop Jump <= CMJ

## Diagrama de Flujo

El diagrama de flujo muestra:

1. El proceso general de `getTrainingSolutions` que recopila y filtra las soluciones de entrenamiento.
2. La lógica de decisión para cada tipo de prueba (BOSCO, CMJ, Squat Jump, Abalakov, MultipleDropJump, MultipleJumps).
3. Los subprocesos para calcular ECR, Contribución de Brazos, RSI y comparación de Drop Jump vs CMJ.

### Cómo Leer el Diagrama

- Los nodos rectangulares representan procesos o acciones.
- Los nodos con forma de diamante representan decisiones.
- Las flechas muestran el flujo de ejecución.
- Los subgráficos muestran procesos detallados para cálculos específicos.

## Fórmulas Detalladas

Para una explicación más detallada de las fórmulas utilizadas en los cálculos, consulte el archivo **training_solutions_formulas.md**. Este documento proporciona:

- Las fórmulas matemáticas exactas utilizadas
- Explicación de cada variable
- Métodos alternativos de cálculo cuando los datos principales no están disponibles
- Interpretación detallada de los resultados

## Uso de Esta Documentación

Esta documentación puede ser utilizada para:

1. Entender qué soluciones de entrenamiento se generan para diferentes resultados de pruebas.
2. Verificar que las soluciones generadas son correctas según los valores calculados.
3. Modificar o extender las soluciones de entrenamiento de manera consistente.
4. Capacitar a nuevos desarrolladores o usuarios sobre la lógica del sistema.

## Ejemplo de Interpretación

Si un atleta tiene un ECR de 15% (calculado a partir de su CMJ y Squat Jump), el sistema recomendará "Énfasis en ambas componentes" con ejercicios que estimulen tanto el componente contráctil como el elástico, como sentadillas isométricas a dos piernas, saltos con sobrecarga y estocadas con paso al frente.
