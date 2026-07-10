export default function ProgressBar({
    value = 0
}) {

    return (

        <div className="progress">

            <div
                className="progress-fill"
                style={{
                    width: `${value}%`
                }}
            />

        </div>

    );

}