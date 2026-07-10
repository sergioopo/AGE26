export default function Badge({
    children,
    type = "primary"
}) {

    return (

        <span className={`badge badge-${type}`}>

            {children}

        </span>

    );

}