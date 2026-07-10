import {

getGeneralAssessment,

getVariationP1,

getVariationP2,

getConfidenceLevel

} from "./analysisEngine";

export function generateExecutiveSummary(){

    const assessment=getGeneralAssessment();

    return{

        title:assessment.level,

        confidence:getConfidenceLevel(),

        paragraphs:[

`La primera prueba presenta una variación de ${getVariationP1()} puntos respecto a 2024.`,

`El supuesto práctico presenta una variación de ${getVariationP2()} puntos respecto a 2024.`,

assessment.message

]

    }

}