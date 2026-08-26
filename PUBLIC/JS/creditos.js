console.log(
    "✅ Microcrédito Jelunor cargado"
);


function formatearCOP(valor) {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(
        Number(valor) || 0
    );
}


const creditAmount =
    document.getElementById(
        "creditAmount"
    );

const creditRange =
    document.getElementById(
        "creditRange"
    );

const creditMonths =
    document.getElementById(
        "creditMonths"
    );

const monthlyPayment =
    document.getElementById(
        "monthlyPayment"
    );

const creditRequested =
    document.getElementById(
        "creditRequested"
    );

const creditTerm =
    document.getElementById(
        "creditTerm"
    );

const creditInterest =
    document.getElementById(
        "creditInterest"
    );

const creditTotal =
    document.getElementById(
        "creditTotal"
    );


function calcularCredito() {

    let monto =
        Number(
            creditAmount.value
        );


    let meses =
        Number(
            creditMonths.value
        );


    if (
        !Number.isFinite(monto) ||
        monto < 100000
    ) {
        monto = 100000;
    }


    if (
        monto > 3000000
    ) {
        monto = 3000000;
    }


    if (
        !Number.isFinite(meses) ||
        meses <= 0
    ) {
        meses = 6;
    }


    creditAmount.value =
        Math.round(monto);


    creditRange.value =
        monto;


    const tasaAnual =
        0.18;


    const tasaMensual =
        tasaAnual / 12;


    const cuota =
        monto *
        tasaMensual /
        (
            1 -
            Math.pow(
                1 + tasaMensual,
                -meses
            )
        );


    const total =
        cuota * meses;


    const intereses =
        total - monto;


    monthlyPayment.textContent =
        formatearCOP(
            cuota
        );


    creditRequested.textContent =
        formatearCOP(
            monto
        );


    creditTerm.textContent =
        `${meses} meses`;


    creditInterest.textContent =
        formatearCOP(
            intereses
        );


    creditTotal.textContent =
        formatearCOP(
            total
        );
}


creditAmount.addEventListener(
    "input",
    () => {

        let valor =
            Number(
                creditAmount.value
            );


        if (
            Number.isFinite(valor)
        ) {

            valor =
                Math.min(
                    Math.max(
                        valor,
                        100000
                    ),
                    3000000
                );


            creditRange.value =
                valor;
        }


        calcularCredito();

    }
);


creditAmount.addEventListener(
    "blur",
    calcularCredito
);


creditRange.addEventListener(
    "input",
    () => {

        creditAmount.value =
            creditRange.value;


        calcularCredito();

    }
);


creditMonths.addEventListener(
    "change",
    calcularCredito
);


calcularCredito();