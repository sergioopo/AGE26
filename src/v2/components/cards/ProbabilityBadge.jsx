export default function ProbabilityBadge({

    probability,
    label = "Confianza"

}){

    let level="badge-low";

    if(probability>=80) level="badge-high";
    else if(probability>=60) level="badge-medium";

    return(

        <span className={`badge ${level}`}>

            {label} {probability}%

        </span>

    )

}
