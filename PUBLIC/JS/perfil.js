console.log(
    "✅ Perfil Jelunor cargado"
);


// =====================================================
// ELEMENTOS
// =====================================================

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const profileInitials =
    document.getElementById(
        "profileInitials"
    );

const profilePhoto =
    document.getElementById(
        "profilePhoto"
    );

const profilePhotoInput =
    document.getElementById(
        "profilePhotoInput"
    );

const changePhotoButton =
    document.getElementById(
        "changePhotoButton"
    );

const removePhotoButton =
    document.getElementById(
        "removePhotoButton"
    );

const photoMessage =
    document.getElementById(
        "photoMessage"
    );

const profileTitle =
    document.getElementById(
        "profileTitle"
    );

const profileName =
    document.getElementById(
        "profileName"
    );

const profileDocument =
    document.getElementById(
        "profileDocument"
    );

const profileEmail =
    document.getElementById(
        "profileEmail"
    );

const profilePhone =
    document.getElementById(
        "profilePhone"
    );

const profileAccountNumber =
    document.getElementById(
        "profileAccountNumber"
    );

const profileAccountType =
    document.getElementById(
        "profileAccountType"
    );

const profileLogoutButton =
    document.getElementById(
        "profileLogoutButton"
    );


// =====================================================
// INICIALES
// =====================================================

function obtenerIniciales(nombre) {

    if (!nombre) {
        return "JL";
    }


    const partes =
        nombre
            .trim()
            .split(/\s+/);


    if (partes.length === 1) {

        return partes[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        partes[0][0] +
        partes[1][0]
    ).toUpperCase();
}


// =====================================================
// MOSTRAR FOTO
// =====================================================

function mostrarFoto(
    imagen,
    nombre
) {

    profileInitials.textContent =
        obtenerIniciales(
            nombre
        );


    if (imagen) {

        profilePhoto.src =
            imagen;


        profilePhoto.classList.remove(
            "hidden"
        );


        removePhotoButton.classList.remove(
            "hidden"
        );


    } else {

        profilePhoto.removeAttribute(
            "src"
        );


        profilePhoto.classList.add(
            "hidden"
        );


        removePhotoButton.classList.add(
            "hidden"
        );
    }
}


// =====================================================
// REDUCIR FOTO
// =====================================================

function procesarImagen(
    archivo
) {

    return new Promise(
        (resolve, reject) => {

            if (
                !archivo.type.startsWith(
                    "image/"
                )
            ) {

                reject(
                    new Error(
                        "Selecciona una imagen válida."
                    )
                );

                return;
            }


            const lector =
                new FileReader();


            lector.onload =
                event => {

                    const imagen =
                        new Image();


                    imagen.onload =
                        () => {

                            const maximo =
                                500;


                            let ancho =
                                imagen.width;


                            let alto =
                                imagen.height;


                            if (
                                ancho > alto &&
                                ancho > maximo
                            ) {

                                alto =
                                    alto *
                                    maximo /
                                    ancho;

                                ancho =
                                    maximo;
                            }


                            if (
                                alto >= ancho &&
                                alto > maximo
                            ) {

                                ancho =
                                    ancho *
                                    maximo /
                                    alto;

                                alto =
                                    maximo;
                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                Math.round(
                                    ancho
                                );


                            canvas.height =
                                Math.round(
                                    alto
                                );


                            const contexto =
                                canvas.getContext(
                                    "2d"
                                );


                            contexto.drawImage(
                                imagen,
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );


                            const resultado =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.78
                                );


                            resolve(
                                resultado
                            );
                        };


                    imagen.onerror =
                        () => {

                            reject(
                                new Error(
                                    "No fue posible leer la imagen."
                                )
                            );
                        };


                    imagen.src =
                        event.target.result;
                };


            lector.onerror =
                () => {

                    reject(
                        new Error(
                            "No fue posible leer el archivo."
                        )
                    );
                };


            lector.readAsDataURL(
                archivo
            );
        }
    );
}


// =====================================================
// CARGAR PERFIL
// =====================================================

async function cargarPerfil() {

    try {

        const respuesta =
            await fetch(
                "/api/auth/me",
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (
            respuesta.status === 401
        ) {

            window.location.href =
                "login.html";

            return;
        }


        const datos =
            await respuesta.json();


        if (
            !respuesta.ok ||
            !datos.ok ||
            !datos.autenticado
        ) {

            window.location.href =
                "login.html";

            return;
        }


        const usuario =
            datos.usuario || {};


        const cuenta =
            datos.cuenta || {};


        const nombre =
            usuario.nombre ||
            "Usuario Jelunor";


        profileTitle.textContent =
            nombre;


        profileName.textContent =
            nombre;


        profileDocument.textContent =
            usuario.documento ||
            "-";


        profileEmail.textContent =
            usuario.correo ||
            "-";


        profilePhone.textContent =
            usuario.telefono ||
            "No registrado";


        profileAccountNumber.textContent =
            cuenta.numeroCuenta ||
            "-";


        profileAccountType.textContent =
            cuenta.tipo ||
            "Ahorros";


        mostrarFoto(
            usuario.fotoPerfil,
            nombre
        );


    } catch (error) {

        console.error(
            "Error cargando perfil:",
            error
        );


        profileTitle.textContent =
            "No fue posible cargar el perfil";
    }
}


// =====================================================
// ELEGIR FOTO
// =====================================================

changePhotoButton.addEventListener(
    "click",
    () => {

        profilePhotoInput.click();

    }
);


// =====================================================
// GUARDAR FOTO
// =====================================================

profilePhotoInput.addEventListener(
    "change",
    async () => {

        const archivo =
            profilePhotoInput.files[0];


        if (!archivo) {
            return;
        }


        photoMessage.textContent =
            "Procesando foto...";

        photoMessage.className =
            "photo-message";


        changePhotoButton.disabled =
            true;


        try {

            const imagen =
                await procesarImagen(
                    archivo
                );


            const respuesta =
                await fetch(
                    "/api/auth/foto-perfil",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                imagen
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
                    "No fue posible guardar la foto."
                );
            }


            profilePhoto.src =
                imagen;


            profilePhoto.classList.remove(
                "hidden"
            );


            removePhotoButton.classList.remove(
                "hidden"
            );


            photoMessage.textContent =
                "✓ Foto actualizada";


            photoMessage.className =
                "photo-message success";


        } catch (error) {

            console.error(
                error
            );


            photoMessage.textContent =
                error.message;


            photoMessage.className =
                "photo-message error";


        } finally {

            changePhotoButton.disabled =
                false;


            profilePhotoInput.value =
                "";
        }
    }
);


// =====================================================
// QUITAR FOTO
// =====================================================

removePhotoButton.addEventListener(
    "click",
    async () => {

        try {

            const respuesta =
                await fetch(
                    "/api/auth/foto-perfil",
                    {
                        method:
                            "DELETE"
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
                    "No fue posible quitar la foto."
                );
            }


            profilePhoto.classList.add(
                "hidden"
            );


            profilePhoto.removeAttribute(
                "src"
            );


            removePhotoButton.classList.add(
                "hidden"
            );


            photoMessage.textContent =
                "Foto eliminada.";


            photoMessage.className =
                "photo-message success";


        } catch (error) {

            photoMessage.textContent =
                error.message;


            photoMessage.className =
                "photo-message error";
        }
    }
);


// =====================================================
// CERRAR SESIÓN
// =====================================================

async function cerrarSesion() {

    profileLogoutButton.disabled =
        true;


    profileLogoutButton.textContent =
        "Saliendo...";


    try {

        const respuesta =
            await fetch(
                "/api/auth/logout",
                {
                    method:
                        "POST"
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                "No fue posible cerrar sesión."
            );
        }


        window.location.href =
            "index.html";


    } catch (error) {

        console.error(
            error
        );


        profileLogoutButton.disabled =
            false;


        profileLogoutButton.textContent =
            "Cerrar sesión";
    }
}


profileLogoutButton.addEventListener(
    "click",
    cerrarSesion
);

// =====================================================
// CAMBIAR CONTRASEÑA
// =====================================================

const passwordForm =
    document.getElementById(
        "passwordForm"
    );

const currentPassword =
    document.getElementById(
        "currentPassword"
    );

const newPassword =
    document.getElementById(
        "newPassword"
    );

const confirmNewPassword =
    document.getElementById(
        "confirmNewPassword"
    );

const changePasswordButton =
    document.getElementById(
        "changePasswordButton"
    );

const passwordMessage =
    document.getElementById(
        "passwordMessage"
    );


if (passwordForm) {

    passwordForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            passwordMessage.textContent =
                "";

            passwordMessage.className =
                "password-message";


            const passwordActual =
                currentPassword.value;


            const passwordNueva =
                newPassword.value;


            const confirmarPassword =
                confirmNewPassword.value;


            if (
                passwordNueva.length < 6
            ) {

                passwordMessage.textContent =
                    "La nueva contraseña debe tener mínimo 6 caracteres.";

                passwordMessage.classList.add(
                    "error"
                );

                return;
            }


            if (
                passwordNueva !==
                confirmarPassword
            ) {

                passwordMessage.textContent =
                    "Las nuevas contraseñas no coinciden.";

                passwordMessage.classList.add(
                    "error"
                );

                return;
            }


            changePasswordButton.disabled =
                true;


            changePasswordButton.textContent =
                "Actualizando...";


            try {

                const respuesta =
                    await fetch(
                        "/api/auth/cambiar-password",
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    passwordActual,
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
                        "No fue posible actualizar la contraseña."
                    );
                }


                passwordMessage.textContent =
                    "✓ Contraseña actualizada correctamente.";


                passwordMessage.classList.add(
                    "success"
                );


                passwordForm.reset();


            } catch (error) {

                console.error(
                    error
                );


                passwordMessage.textContent =
                    error.message;


                passwordMessage.classList.add(
                    "error"
                );


            } finally {

                changePasswordButton.disabled =
                    false;


                changePasswordButton.textContent =
                    "Actualizar contraseña";
            }

        }
    );
}

cargarPerfil();