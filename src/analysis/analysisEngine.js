import { dashboard } from "../data/dashboard";
import { statistics } from "../data/statistics";
import { scenarios } from "../data/scenarios";

/*
==========================================================
AGE Statistical Intelligence System
Analysis Engine v1
==========================================================
*/

export function getConfidenceLevel() {

    return dashboard.model.confidence;

}

export function getRepresentativity(){

    return dashboard.model.representativity;

}

export function getConvergence(){

    return dashboard.model.convergence;

}

export function getResidualRisk(){

    return dashboard.model.residualRisk;

}

export function getCurrentScenario(){

    return scenarios.find(

        s => s.name === "Central"

    );

}

export function getVariationP1(){

    return statistics.variation.p1;

}

export function getVariationP2(){

    return statistics.variation.p2;

}

export function getGeneralAssessment(){

    const p1=getVariationP1();

    const p2=getVariationP2();

    const confidence=getConfidenceLevel();

    if(

        p1<-3 &&
        p2<-1 &&
        confidence>=80

    ){

        return{

            level:"Muy favorable",

            color:"success",

            message:

            "Las medias observadas respaldan un escenario inferior al de 2024."

        }

    }

    if(confidence>=70){

        return{

            level:"Favorable",

            color:"warning",

            message:

            "Existe evidencia consistente para esperar un corte ligeramente inferior."

        }

    }

    return{

        level:"Incierto",

        color:"danger",

        message:

        "La información disponible todavía no permite identificar un escenario dominante."

    }

}