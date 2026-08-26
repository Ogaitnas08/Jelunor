console.log(
    "✅ Recuperación Jelunor cargada"
);


const recoveryForm =
    document.getElementById(
        "recoveryForm"
    );

const recoveryEmail =
    document.getElementById(
        "recoveryEmail"
    );

const recoveryDocument =
    document.getElementById(
        "recoveryDocument"
    );

const newRecoveryPassword =
    document.getElementById(
        "newRecoveryPassword"
    );

const confirmRecoveryPassword =
    document.getElementById(
        "confirmRecoveryPassword"
    );

const recoveryMessage =
    document.getElementById(
        "recoveryMessage"
    );

const recoveryButton =
    document.getElementById(
        "recoveryButton"
    );


// =========================================
// SOLO NÚMEROS EN DOCUMENTO
// =========================================

recoveryDocument.addEventListener(
    "input",
    () => {

        recoveryDocument.value =
            recoveryDocument.value
                .replace(
                    /\D/g,
                    ""
                );

    }
);


// =========================================
// RECUPERAR CONTRASEÑA
// =========================================

recoveryForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        recoveryMessage.textContent =
            "";

        recoveryMessage.className =
            "mensaje";


        const correo =
            recoveryEmail
                .value
                .trim()
                .toLowerCase();


        const documento =
            recoveryDocument
                .value
                .trim();


        const passwordNueva =
            newRecoveryPassword.value;


        const confirmarPassword =
            confirmRecoveryPassword.value;


        if (
            passwordNueva.length < 6
        ) {

            recoveryMessage.textContent =
                "La contraseña debe tener mínimo 6 caracteres.";

            recoveryMessage.classList.add(
                "error"
            );

            return;
        }


        if (
            passwordNueva !==
            confirmarPassword
        ) {

            recoveryMessage.textContent =
                "Las contraseñas no coinciden.";

            recoveryMessage.classList.add(
                "error"
            );

            return;
        }


        recoveryButton.disabled =
            true;


        recoveryButton.textContent =
            "Actualizando...";


        try {

            const respuesta =
                await fetch(
                    "/api/auth/recuperar-password",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                correo,
                                documento,
                                passwordNueva,
                                confirmarPassword

                            })

                    }
                );


            const datos =
                await respuesta.json();


            if (
                !respuesta.ok ||
                !datos.ok
            ) {

                throw new Error(
                    datos.mensaje ||
                    "No fue posible recuperar la cuenta."
                );
            }


            recoveryMessage.textContent =
                "✓ Contraseña actualizada. Ya puedes iniciar sesión.";


            recoveryMessage.classList.add(
                "success"
            );


            recoveryForm.reset();


            setTimeout(
                () => {

                    window.location.href =
                        "login.html";

                },
                1800
            );


        } catch (error) {

            console.error(
                error
            );


            recoveryMessage.textContent =
                error.message;


            recoveryMessage.classList.add(
                "error"
            );


        } finally {

            recoveryButton.disabled =
                false;


            recoveryButton.textContent =
                "Actualizar contraseña";
        }

    }
);