import { dashboard } from "../data/dashboard";

/*
=========================================================
MODEL SCORE ENGINE
=========================================================
*/

export function calculateModelScore() {

    const confidence = dashboard.model.confidence;
    const representativity = dashboard.model.representativity;
    const convergence = dashboard.model.convergence;
    const risk = dashboard.model.residualRisk;

    // ponderaciones
    const score =
        confidence * 0.35 +
        representativity * 0.25 +
        convergence * 0.25 +
        (100 - risk) * 0.15;

    return Math.round(score);

}

export function getModelRating(score){

    if(score>=90){

        return{
            label:"Excelente",
            color:"success"
        }

    }

    if(score>=80){

        return{
            label:"Muy bueno",
            color:"primary"
        }

    }

    if(score>=70){

        return{
            label:"Bueno",
            color:"warning"
        }

    }

    return{

        label:"Mejorable",
        color:"danger"

    }

}