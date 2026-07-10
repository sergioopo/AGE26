export default function ProbabilityBadge({

    probability

}) {

    let type = "danger";

    if (probability >= 75) type = "success";
    else if (probability >= 50) type = "warning";

    return (

        <span className={`badge badge-${type}`}>

            {probability}% de probabilidad

        </span>

    );

}