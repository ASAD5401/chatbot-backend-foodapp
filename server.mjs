import express from "express";
import Alexa from 'ask-sdk-core';
import morgan from "morgan";
import { ExpressAdapter } from 'ask-sdk-express-adapter';
import mongoose from 'mongoose';
import axios from 'axios'

mongoose.connect('mongodb+srv://saadkhan:saadkhan@cluster0.fquu7.mongodb.net/myFirstDatabase?retryWrites=true&w=majority');
const User = mongoose.model('User', {
  name: String,
  email: String,
  skillName:String,
  usedOn:{type:Date,default:Date.now}
});

const app = express();
app.use(morgan("dev"))

const PORT = process.env.PORT || 3000;


const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const LaunchRequestHandler = {

    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {

        // const table=new User ({name:'Asad Ali Khan',email:'asad@gmail.com',skillName:'Crazio'})
        // table.save()
 
        
        const speakOutput = 'Welcome to crazio. Would you want to see our menu '
        const reprompt='Would you want to see our menu'
        const textCard='Would you want to see our menu'

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(reprompt)
            .withSimpleCard("CRAZIO", textCard)
            .getResponse();
    }
};
// const ShowMenuIntentHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//             && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ShowMenuIntentHandler';
//     },
//     handle(handlerInput) {

//         const speakOutput = 'Welcome to crazio. Would you want to see our menu '
//         const reprompt='Would you want to see our menu'
//         const textCard='Would you want to see our menu'

//         return handlerInput.responseBuilder
//             .speak(speakOutput)
//             .reprompt(reprompt)
//             .withSimpleCard("CRAZIO", textCard)

    
//             .getResponse();
//     }
// };



const EmailIntentHandler = {
    canHandle(handlerInput) {
      console.log('email intent')
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'EmailIntentHandler';
    },
    async handle(handlerInput) {
      const { serviceClientFactory, responseBuilder } = handlerInput;
  
      const apiAccessToken = Alexa.getApiAccessToken(handlerInput.requestEnvelope)
      console.log("apiAccessToken: ", apiAccessToken);
  
      try {
        // https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-customer-contact-information-for-use-in-your-skill.html#get-customer-contact-information
  
        const responseArray = await Promise.all([
          axios.get("https://api.amazonalexa.com/v2/accounts/~current/settings/Profile.email",
            { headers: { Authorization: `Bearer ${apiAccessToken}` } },
          ),
          axios.get("https://api.amazonalexa.com/v2/accounts/~current/settings/Profile.name",
            { headers: { Authorization: `Bearer ${apiAccessToken}` } },
          ),
        ])
  
        const email = responseArray[0].data;
        const name = responseArray[1].data;
        console.log("email: ", email);
  
        if (!email) {
          return handlerInput.responseBuilder
            .speak(`looks like you dont have an email associated with this device, please set your email in Alexa App Settings`)
            .getResponse();
        }
        return handlerInput.responseBuilder
          .speak(`Dear ${name}, your email is: ${email}`)
          .getResponse();
  
      } catch (error) {
        console.log("error code: ", error.response.status);
  
        if (error.response.status === 403) {
          return responseBuilder
            .speak('I am Unable to read your email. Please goto Alexa app and then goto Malik Resturant Skill and Grant Profile Permissions to this skill')
            .withAskForPermissionsConsentCard(["alexa::profile:email:read"]) // https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-customer-contact-information-for-use-in-your-skill.html#sample-response-with-permissions-card
            .getResponse();
        }
        return responseBuilder
          .speak('Uh Oh. Looks like something went wrong.')
          .getResponse();
      }
    }
  }



const MenuIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MenuIntentHandler';
    },
    handle(handlerInput) {

        const speakOutput = 'in menu we have Plain Fries. Pizza Fries. Zinger Burger. Club Sandwhich.'
        const reprompt='Would you like to try something'
        const textCard='1.Plain Fries.\n 2.Pizza Fries.\n 3.Zinger Burger.\n 4.Club Sandwhich.'

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(reprompt)
            .withSimpleCard("MENU", textCard)

    
            .getResponse();
    }
};



const PlaceOrderIntentHandler = {
    
    canHandle(handlerInput) {
        // console.log('asad')
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlaceOrderIntentHandler';
    },
    async handle(handlerInput) {
        const we_slots= handlerInput
        .requestEnvelope
        .request
        .intent
        .slots;

        const foodName=we_slots.food.value
        const qty=we_slots.quantity.value

        const speakOutput = `Your order of ${qty} ${foodName} has been placed`
        // const reprompt='Would you want to see our menu'
        const textCard=`Your order of ${qty} ${foodName} has been placed`

        return handlerInput.responseBuilder
            .speak(speakOutput)
            // .reprompt(reprompt)
            .withSimpleCard("ORDER PLACED", textCard)

    
            .getResponse();
    }
};






const skillBuilder = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        // ShowMenuIntentHandler,
        MenuIntentHandler,
        PlaceOrderIntentHandler,
        EmailIntentHandler
    )
    .addErrorHandlers(
        ErrorHandler
    )
const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, true, true);
app.post('/api/v1/webhook-alexa', adapter.getRequestHandlers());
app.use(express.json())

app.post('/webhook', (req, res, next) => {

    console.log("req.body: ", req.body);
    res.send("this is a home");
});
app.get('/profile', (req, res, next) => {
    res.send("this is a profile");
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});





