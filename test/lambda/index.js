/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');

const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');


const languageStrings = {
  en: {
    translation: {
      WELCOME_MESSAGE: 'Welcome, you can say Hello or Help. Which would you like to try?',
      HELLO_MESSAGE: 'Hello World!',
      HELP_MESSAGE: 'You can say hello to me! How can I help?',
      GOODBYE_MESSAGE: 'Goodbye!',
      REFLECTOR_MESSAGE: 'You just triggered %s',
      FALLBACK_MESSAGE: 'Sorry, I don\'t know about that. Please try again.',
      ERROR_MESSAGE: 'Sorry, there was an error. Please try again.',
      Q1: 'In what year did World War II start?',
      Q2: 'What is the capital of Australia?',
      Q3: 'Who painted the Mona Lisa?',
      START_MESSAGE:'The game has started. Good luck with the questions!',
      CORRECT_MESSAGE:'Correct answer! Very good!',
      INCORRECT_MESSAGE:'Incorrect response. The correct answer is option number %s'
    }
  },
  es:{
    translation: {
      WELCOME_MESSAGE: '¡Bienvenido a la Skill de preguntas de cultura general! ¿Estás listo para comenzar?',
      HELLO_MESSAGE: 'Hola, ¿como te encuentras?',
      HELP_MESSAGE: 'Puedes decirme hola. Cómo te puedo ayudar?',
      GOODBYE_MESSAGE: 'Adiós!',
      REFLECTOR_MESSAGE: 'Acabas de activar %s',
      FALLBACK_MESSAGE: 'Lo siento, no se nada sobre eso. Por favor inténtalo otra vez.',
      ERROR_MESSAGE: 'Lo siento, ha habido un problema. Por favor inténtalo otra vez.',
      START_MESSAGE:'El juego ha comenzado. ¡Buena suerte con las preguntas!',
      Q1: '¿En qué año comenzó la Segunda Guerra Mundial?',
      Q2: '¿Cuál es la capital de Australia?',
      Q3: '¿Quién pintó la Mona Lisa?',
      CORRECT_MESSAGE:'¡Respuesta correcta! ¡Muy bien!',
      INCORRECT_MESSAGE:'Respuesta incorrecta. La respuesta correcta es la opción número %s'
    }
  }
}




const DOCUMENT_ID = "bienvenido";
const DOCUMENT_ID2 = "hola";
const DOCUMENT_ID3 = "ayuda";
const DOCUMENT_ID4 = "adios";

const DOCUMENT_ID_start = "iniciar";
const DOCUMENT_ID_F = "fin";
const DOCUMENT_ID_si = "correcta";
const DOCUMENT_ID_no = "incorrecta";


const datasource = {
    "helloWorldDataSource": {
        "primaryText": "${payload.helloWorldDataSource.primaryText}"
    }
};

const createDirectivePayload = (aplDocumentId, dataSources = {}, tokenId = "documentToken") => {
    return {
        type: "Alexa.Presentation.APL.RenderDocument",
        token: tokenId,
        document: {
            type: "Link",
            src: "doc://alexa/apl/documents/" + aplDocumentId
        },
        datasources: dataSources
    }
};

function generateQuestions(idioma) {
  let questions = [];

  if (idioma === 'en-US') {
    questions = [
      {
        question: 'In what year did World War II start?',
        options: ['1) 1939', '2) 1945', '3) 1914', '4) 1950'],
        correctAnswerIndex: 1,
      },
      {
        question: 'What is the capital of Australia?',
        options: ['1) Melbourne', '2) Sydney', '3) Canberra', '4) Brisbane'],
        correctAnswerIndex: 3,
      },
      {
        question: 'Who painted the Mona Lisa?',
        options: ['1) Pablo Picasso', '2) Vincent van Gogh', '3) Leonardo da Vinci', '4) Salvador Dalí'],
        correctAnswerIndex: 3,
      }
    ];
  } else if (idioma === 'es-ES') {
    questions = [
      {
        question: '¿En qué año comenzó la Segunda Guerra Mundial?',
        options: ['1) 1939', '2) 1945', '3) 1914', '4) 1950'],
        correctAnswerIndex: 2,
      },
      {
        question: '¿Cuál es la capital de Australia?',
        options: ['1) Melbourne', '2) Sydney', '3) Canberra', '4) Brisbane'],
        correctAnswerIndex: 3,
      },
      {
        question: '¿Quién pintó la Mona Lisa?',
        options: ['1) Pablo Picasso', '2) Vincent van Gogh', '3) Leonardo da Vinci', '4) Salvador Dalí'],
        correctAnswerIndex: 3,
      }
    ];
  }

  return questions;
}

let currentQuestionIndex = 0;
let correctAnswers = 0;

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = requestAttributes.t('WELCOME_MESSAGE');

    if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
      const aplDirective = createDirectivePayload(DOCUMENT_ID, datasource);
      handlerInput.responseBuilder.addDirective(aplDirective);
    }
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const StartGameIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartGameIntent';
  },
  handle(handlerInput) {
    const idioma = handlerInput.requestEnvelope.request.locale;
    console.log('Idioma:', idioma);

    const preguntas = generateQuestions(idioma);
    console.log('Preguntas:', preguntas);

    handlerInput.attributesManager.getSessionAttributes().preguntas = preguntas;
    handlerInput.attributesManager.getSessionAttributes().currentQuestionIndex = 0;
    handlerInput.attributesManager.getSessionAttributes().correctAnswers = 0;

    if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
      const aplDirective = createDirectivePayload(DOCUMENT_ID_start, datasource);
      handlerInput.responseBuilder.addDirective(aplDirective);
    }

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = requestAttributes.t('START_MESSAGE');
    return askQuestion(handlerInput, preguntas, speakOutput);
  },
};



const AnswerIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent';
  },
  handle(handlerInput) {
    const userAnswerIndex = Alexa.getSlotValue(handlerInput.requestEnvelope, 'answerIndex');
    console.log('Respuesta del usuario:', userAnswerIndex);

    const currentQuestion = handlerInput.attributesManager.getSessionAttributes().currentQuestion;
    const preguntas = handlerInput.attributesManager.getSessionAttributes().preguntas;

    let speakOutput;
    let aplDocumentId;

    if (userAnswerIndex == currentQuestion.correctAnswerIndex) {
      const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
      const correctSpeakOutput = requestAttributes.t('CORRECT_MESSAGE');
      speakOutput = correctSpeakOutput;
      aplDocumentId = 'DOCUMENT_ID_si';
       if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
        const aplDirective = createDirectivePayload(DOCUMENT_ID_si);
        handlerInput.responseBuilder.addDirective(aplDirective);
      }
    } else {
      const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
      const incorrectSpeakOutput = requestAttributes.t('INCORRECT_MESSAGE', currentQuestion.correctAnswerIndex + 1);
      speakOutput = incorrectSpeakOutput;
      aplDocumentId = 'DOCUMENT_ID_no';
       if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
        const aplDirective = createDirectivePayload(DOCUMENT_ID_no);
        handlerInput.responseBuilder.addDirective(aplDirective);
      }
    }

    const datasource = {
      helloWorldDataSource: {
        primaryText: userAnswerIndex
      }
    };

    if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
      const aplDirective = createDirectivePayload(aplDocumentId, datasource);
      handlerInput.responseBuilder.addDirective(aplDirective);
    }

    handlerInput.attributesManager.getSessionAttributes().currentQuestionIndex++;
    if (handlerInput.attributesManager.getSessionAttributes().currentQuestionIndex < preguntas.length) {
      return askQuestion(handlerInput, preguntas, speakOutput);
    } else {
      const totalQuestions = preguntas.length;
      const correctAnswers = handlerInput.attributesManager.getSessionAttributes().correctAnswers;
      const average = (correctAnswers / totalQuestions) * 100;
      speakOutput += ' Has respondido correctamente ' + correctAnswers + ' de ' + totalQuestions + ' preguntas. Tu promedio es del ' + average + '%.';

      if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
        const aplDirective = createDirectivePayload('DOCUMENT_ID_F', datasource);
        handlerInput.responseBuilder.addDirective(aplDirective);
      }

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .getResponse();
    }
  },
};


function askQuestion(handlerInput, preguntas, previousOutput = '') {
  const currentQuestionIndex = handlerInput.attributesManager.getSessionAttributes().currentQuestionIndex;
  const currentQuestion = preguntas[currentQuestionIndex];
  const options = currentQuestion.options.join(', ');
  const speakOutput = previousOutput + ' ' + currentQuestion.question + ' Las opciones son: ' + options;

  handlerInput.attributesManager.getSessionAttributes().currentQuestion = currentQuestion;

  return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(currentQuestion.question)
    .getResponse();
}



const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const speakOutput = requestAttributes.t('HELLO_MESSAGE');

        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID2, datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const speakOutput = requestAttributes.t('HELP_MESSAGE');
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID3, datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
      const speakOutput = requestAttributes.t('GOODBYE_MESSAGE');

        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = createDirectivePayload(DOCUMENT_ID_F, datasource);
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
      const speakOutput = requestAttributes.t('FALLBACK_MESSAGE');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
  canHandle(handlerInput, error) {
    return true;
  },
  handle(handlerInput, error) {
    console.log('Error ocurred:', error);

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = requestAttributes.t('ERROR_MESSAGE');

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};


const LoggingRequestInterceptor = {
    process(handlerInput) {
        console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
    }
};

// This response interceptor will log all outgoing responses of this lambda
const LoggingResponseInterceptor = {
    process(handlerInput, response) {
      console.log(`Outgoing response: ${JSON.stringify(response)}`);
    }
};

// This request interceptor will bind a translation function 't' to the requestAttributes.
const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      fallbackLng: 'en',
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      resources: languageStrings,
      returnObjects: true
    });

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) {
      return localizationClient.t(...args);
    }
  }
}

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        StartGameIntentHandler,
        AnswerIntentHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        LocalizationInterceptor,
        LoggingRequestInterceptor)
    .addResponseInterceptors(
        LoggingResponseInterceptor)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();