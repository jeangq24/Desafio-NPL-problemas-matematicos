// server.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Configuración
const CHATGPT_PROXY_URL = process.env.CHATGPT_PROXY_URL;
const CHATGPT_PROXY_TOKEN = process.env.CHATGPT_PROXY_TOKEN;
const SEND_SOLUTION = process.env.SEND_SOLUTION;
const PORT = process.env.PORT || 3000;
const GET_PROBLEM = process.env.GET_PROBLEM;


// Función para detectar propiedades numéricas en los datos de cada entidad
const detectNumericProperties = (data, entity) => {
    let allowedProperties = [];

    if (entity.universe.toLowerCase() === 'pokemon') {
        allowedProperties = ['base_experience', 'height', 'weight'];
    } else if (entity.universe.toLowerCase() === 'starwars') {
        if (entity.type.toLowerCase() === 'planet') {
            allowedProperties = ['rotation_period', 'orbital_period', 'diameter', 'gravity', 'surface_water', 'population'];
        } else if (entity.type.toLowerCase() === 'people') {
            allowedProperties = ['height', 'mass'];
        }
    }

    const numericProps = {};
    allowedProperties.forEach(prop => {
        if (data[prop] !== undefined) {
            const num = parseFloat(data[prop]);
            if (!isNaN(num)) {
                numericProps[prop] = num;
            }
        }
    });
    return numericProps;
};

// Análisis del problema usando el proxy de ChatGPT
const analyzeProblem = async (problemText) => {
    try {
        const response = await axios.post(
            CHATGPT_PROXY_URL,
            {
                model: "gpt-4o-mini",
                messages: [{
                    role: 'system',
                    content: `
Analiza el siguiente problema y genera un JSON estricto que contenga dos secciones: "entities" y "operations". Sigue estas especificaciones:

1. **Entities**: Array de objetos, cada uno representando una entidad extraída del problema.
   - **name**: (string) Nombre de la entidad (por ejemplo, nombre de un personaje o planeta de Star Wars, o de un Pokémon).
   - **universe**: (string) Debe ser "pokemon" o "starwars", según corresponda.
   - **type**: (string) Tipo de entidad; puede ser "people" (para personajes), "planet" (para planetas) o "pokemon".
   - **numeric_properties**: (string[]) Lista de propiedades numéricas relevantes.  
     * Para Pokémon: incluye: "base_experience", "height", "weight".
     * Para planetas: incluye: "rotation_period", "orbital_period", "diameter", "gravity", "surface_water", "population".
     * Para personas (people): incluye "height", "mass".

2. **Operations**: Array de objetos, cada uno representando una operación matemática propuesta.
   - **description**: (string) Descripción breve de la operación.
   - **operator**: (string) Uno de los siguientes operadores: "+", "-", "*", "/".
   - **elements**: Objeto que contiene dos claves:
     - **left**: Objeto con:
       - **entity**: (string) Nombre de la entidad involucrada.
       - **property**: (string) Nombre de la propiedad numérica.
       - O un objeto con el campo "ref": (string) Referencia al resultado de una operación previa (por ejemplo, "op1", "op2", etc.).
     - **right**: Puede ser:
       - Un objeto similar a "left" (con "entity" y "property") si se trata de una operación entre propiedades,
       - O un objeto con el campo "ref" si se desea usar un resultado intermedio.
       - O directamente un número (number) si se opera con un valor fijo.
   - **final**: (opcional, boolean) Si se establece como true, indica que esta operación define el resultado final del problema. Si ninguna operación está marcada como final, se asumirá que la última operación es la final.
Formato exacto del JSON:
{
  "entities": [
    {
      "name": "valor",
      "universe": "pokemon" o "starwars",
      "type": "people" o "planet" o "pokemon",
      "numeric_properties": ["propiedad1", "propiedad2", ...]
    }
  ],
  "operations": [
    {
      "description": "valor",
      "operator": "+" o "-" o "*" o "/",
      "elements": {
        "left": { "entity": "valor", "property": "valor" },
        "right": { "entity": "valor", "property": "valor" } o número
      }
    }
  ]
}

Utiliza únicamente los campos y estructuras indicadas. Si alguna información no se puede extraer del problema, omite ese objeto o utiliza valores nulos o vacíos según corresponda.
`
                }, {
                    role: 'user',
                    content: problemText
                }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${CHATGPT_PROXY_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.data?.choices?.[0]?.message?.content) {
            throw new Error('Respuesta inválida del proxy de ChatGPT');
        }
        const rawResponse = response.data.choices[0].message.content;
        const cleanedResponse = rawResponse.replace(/^```json\s*|\s*```$/g, '');
        const analysis = JSON.parse(cleanedResponse);

        if (!analysis.entities || !analysis.operations) {
            console.error('Respuesta recibida:', rawResponse);
            throw new Error('Estructura JSON inválida en la respuesta');
        }
        return analysis;

    } catch (error) {
        console.error('Error completo en análisis:', error.response?.data || error.message);
        throw new Error(`Error en análisis: ${error.message}`);
    }
};

// Obtención de datos de las entidades (Pokémon o Star Wars)
const fetchEntityData = async (entity) => {
    try {
        if (!entity || !entity.name || !entity.universe) {
            throw new Error(`Entidad inválida: ${JSON.stringify(entity)}`);
        }
        let data;
        if (entity.universe.toLowerCase() === 'pokemon') {
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${entity.name.toLowerCase()}`);
            data = response.data;
        }
        if (entity.universe.toLowerCase() === 'starwars') {
            const endpoint = entity.type.toLowerCase() === 'planet'
                ? `https://swapi.dev/api/planets/?search=${entity.name.toLowerCase()}`
                : `https://swapi.dev/api/people/?search=${entity.name.toLowerCase()}`;
            const response = await axios.get(endpoint);
            data = response.data.results[0];
        }
        return {
            ...entity,
            numericProperties: detectNumericProperties(data, entity),
        };
    } catch (error) {
        throw new Error(`Error obteniendo datos para ${entity.name}: ${error.message}`);
    }
};

// Motor de cálculos
class ArithmeticEngine {
    constructor(entities) {
        this.entities = new Map();
        for (const entity of entities) {
            if (entity && entity.name) {
                this.entities.set(entity.name.toLowerCase(), entity);
            }
        }
        this.intermediateResults = {};
    }

    resolveValue(source) {
        if (typeof source === 'number') return source;
        if (typeof source === 'object' && source !== null) {
            if (source.ref) {
                if (this.intermediateResults[source.ref] !== undefined) {
                    return this.intermediateResults[source.ref];
                }
                throw new Error(`Resultado intermedio no encontrado para referencia: ${source.ref}`);
            }
            const entityName = source.entity.toLowerCase();
            const entity = this.entities.get(entityName);
            if (!entity) {
                throw new Error(`Entidad no encontrada: ${source.entity}`);
            }
            const value = entity.numericProperties[source.property];
            if (typeof value === 'undefined') {
                throw new Error(`Propiedad no encontrada: ${source.entity}.${source.property}`);
            }
            return value;
        }
        throw new Error(`Tipo de fuente no reconocido: ${source}`);
    }

    executeOperation(operation) {
        const left = this.resolveValue(operation.elements.left);
        const right = this.resolveValue(operation.elements.right);
        switch (operation.operator) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                if (right === 0) throw new Error('División por cero');
                return left / right;
            default:
                throw new Error(`Operador no soportado: ${operation.operator}`);
        }
    }

    process(operations) {
        const results = [];
        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            try {
                const result = this.executeOperation(op);
                this.intermediateResults[`op${i + 1}`] = result;
                results.push({
                    description: op.description,
                    result,
                    operation: op,
                    error: null
                });
            } catch (error) {
                results.push({
                    description: op.description,
                    result: null,
                    operation: op,
                    error: error.message
                });
            }
        }
        return results;
    }
}

// Función para formatear el resultado a 10 decimales
function formatDecimal(num) {
    const roundedStr = num.toFixed(10);
    const parsed = parseFloat(roundedStr);
    if (Number.isInteger(parsed)) {
        return parsed.toFixed(1);
    }
    return roundedStr.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, ".0");
}

// Middleware para registrar las peticiones
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Función que procesa un problema con hasta dos intentos
async function processProblem(problem) {
    let attemptsCount = 0;
    while (attemptsCount < 2) {
        try {
            const analysis = await analyzeProblem(problem.problem);
            const entities = await Promise.all(analysis.entities.map(fetchEntityData));
            const engine = new ArithmeticEngine(entities);
            const results = engine.process(analysis.operations);
            const finalOp = results.find(op => op.operation.final) || results[results.length - 1];
            const computed = formatDecimal(finalOp.result);
            return computed;
        } catch (error) {
            attemptsCount++;
            console.error(`Intento ${attemptsCount} fallido para el problema ${problem.problem_id || problem.id}: ${error.message}`);
        }
    }
    // Si falla en ambos intentos, retornamos 0
    return 0;
}

// Función para enviar la respuesta a la API
async function submitAnswer(problem_id, answer) {
    try {
        const responseSolution = await axios.post(
            SEND_SOLUTION,
            { problem_id, answer },
            {
                headers: {
                    'Authorization': `Bearer ${CHATGPT_PROXY_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log("SOLUCIÓN ENVIADA:", responseSolution.data);
    } catch (error) {
        console.error("Error enviando solución para problema", problem_id, error.message);
    }
}

// Función principal que ejecuta el desafío durante 3 minutos
function startTechnicalChallenge() {
    const DURATION = 3 * 60 * 1000; // 3 minutos
    const REQUEST_INTERVAL = 1000;  // 1 segundo entre requests

    let challengeStats = {
        total: 0,
        errors: 0,
        attempts: []
    };

    console.log('\n=== INICIANDO DESAFÍO TÉCNICO ===');
    console.log(`Ejecutando por 3 minutos (${new Date().toLocaleTimeString()})\n`);

    const interval = setInterval(async () => {
        let problem, problem_id;
        try {
            // 1. Obtener el problema
            const { data } = await axios.get(GET_PROBLEM, {
                headers: {
                    'Authorization': `Bearer ${CHATGPT_PROXY_TOKEN}`,
                }
            });

            console.log("start", data)
            problem = data;
            problem_id = problem.problem_id || problem.id;

            // 2. Procesar el problema con hasta dos intentos
            const computed = await processProblem(problem);

            // 3. Enviar la solución (ya sea la solución correcta o 0 en caso de error)
            await submitAnswer(problem_id, computed);

            challengeStats.total++;
            challengeStats.attempts.push({
                id: problem_id,
                computed,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            // Si ocurre cualquier error en el flujo, se envía respuesta "0"
            if (!problem_id && problem) {
                problem_id = problem.problem_id || problem.id;
            }
            await submitAnswer(problem_id || 'desconocido', 0);
            challengeStats.total++;
            challengeStats.errors++;
            challengeStats.attempts.push({
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.error(`⛔ Error: ${error.message}`);
        }
    }, REQUEST_INTERVAL);

    // Detener la ejecución después de 3 minutos
    setTimeout(() => {
        clearInterval(interval);
        console.log('\n=== RESULTADOS DEL DESAFÍO ===');
        console.log(`Total intentos: ${challengeStats.total}`);
        console.log(`Errores: ${challengeStats.errors}`);
        console.log('==============================\n');
    }, DURATION);
}

// Iniciar el servidor y automáticamente arrancar el desafío
app.listen(PORT, () => {
    console.log(`Servidor de cálculo intergaláctico en puerto ${PORT}`);
    startTechnicalChallenge();
});
