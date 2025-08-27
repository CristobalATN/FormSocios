// Variable global para almacenar los datos de regiones y comunas
let regionesComunasData = [];

// Función para cargar las regiones y comunas desde el archivo JSON
async function cargarRegionesYComunas() {
    console.log('Iniciando carga de regiones y comunas...');
    try {
        // Cargar datos si no están en memoria
        if (regionesComunasData.length === 0) {
            console.log('Cargando datos de regiones y comunas...');
            const response = await fetch('assets/regionesycomunas.json');
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de regiones y comunas');
            }
            regionesComunasData = await response.json();
            console.log('Datos de regiones y comunas cargados:', regionesComunasData.length, 'registros');
        }
        
        const selectRegion = document.getElementById('region');
        if (!selectRegion) {
            console.error('No se encontró el elemento select de región');
            return false;
        }
        
        // Obtener regiones únicas
        const regionesUnicas = [...new Set(regionesComunasData.map(item => item['Región']))];
        console.log('Regiones encontradas:', regionesUnicas.length);
        
        // Guardar la selección actual
        const regionSeleccionada = selectRegion.value;
        
        // Limpiar opciones existentes
        $(selectRegion).empty().append(new Option('Seleccione una región', ''));
        
        // Agregar regiones al select
        regionesUnicas.forEach(region => {
            const option = new Option(region, region);
            selectRegion.add(option);
        });
        
        // Restaurar la selección anterior si existe
        if (regionSeleccionada && regionesUnicas.includes(regionSeleccionada)) {
            selectRegion.value = regionSeleccionada;
        }
        
        // Forzar actualización de Select2
        $(selectRegion).trigger('change.select2');
        
        console.log('Regiones cargadas en el select:', selectRegion.options.length);
        
        // Si hay una región seleccionada, actualizar las comunas
        if (selectRegion.value) {
            console.log('Actualizando comunas para región:', selectRegion.value);
            actualizarComunas(selectRegion.value);
        } else {
            // Limpiar comunas si no hay región seleccionada
            const selectComuna = document.getElementById('comuna');
            if (selectComuna) {
                selectComuna.disabled = true;
                $(selectComuna).val(null).trigger('change');
                
                // Limpiar opciones excepto la primera
                while (selectComuna.options.length > 1) {
                    selectComuna.remove(1);
                }
            }
        }
        
        console.log('Regiones cargadas correctamente');
        return true;
    } catch (error) {
        console.error('Error al cargar regiones y comunas:', error);
        return false;
    }
}

function validarRUN(run) {
    // Eliminar puntos y espacios, convertir a mayúsculas
    const runLimpio = run.replace(/\./g, '').replace(/\s+/g, '').toUpperCase();
    
    // Validar formato básico (7-8 dígitos + guión + dígito verificador K o número)
    if (!/^\d{7,8}-[\dKk]$/.test(runLimpio)) {
        return false;
    }
    
    // Separar número y dígito verificador
    const [numero, digitoVerificador] = runLimpio.split('-');
    
    // Validar dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    // Recorrer el número de derecha a izquierda
    for (let i = numero.length - 1; i >= 0; i--) {
        suma += parseInt(numero.charAt(i)) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    let dvEsperado = 11 - resto;
    
    // Ajustar dígito verificador esperado
    if (dvEsperado === 11) dvEsperado = '0';
    if (dvEsperado === 10) dvEsperado = 'K';
    
    // Comparar con el dígito verificador ingresado
    return digitoVerificador.toUpperCase() === dvEsperado.toString();
}

function validarCampo(campo) {
    const valor = campo.value.trim();
    const esRequerido = campo.hasAttribute('required');
    const tipo = campo.type;
    const nombre = campo.name;
    const errorElement = campo.closest('.form-group')?.querySelector('.error-message');
    if (errorElement) errorElement.textContent = '';
    campo.classList.remove('is-invalid');
    if (esRequerido && !valor) {
        campo.classList.add('is-invalid');
        if (errorElement) errorElement.textContent = 'Este campo es obligatorio';
        return false;
    }
    if (valor) {
        switch (tipo) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(valor)) {
                    campo.classList.add('is-invalid');
                    if (errorElement) errorElement.textContent = 'Ingrese un correo electrónico válido';
                    return false;
                }
                break;
            case 'tel':
                const telefonoRegex = /^[0-9+\-\s()]{8,20}$/;
                if (!telefonoRegex.test(valor)) {
                    campo.classList.add('is-invalid');
                    if (errorElement) errorElement.textContent = 'Ingrese un número de teléfono válido';
                    return false;
                }
                break;
            case 'number':
                if (campo.min && parseFloat(valor) < parseFloat(campo.min)) {
                    campo.classList.add('is-invalid');
                    if (errorElement) errorElement.textContent = `El valor mínimo permitido es ${campo.min}`;
                    return false;
                }
                if (campo.max && parseFloat(valor) > parseFloat(campo.max)) {
                    campo.classList.add('is-invalid');
                    if (errorElement) errorElement.textContent = `El valor máximo permitido es ${campo.max}`;
                    return false;
                }
                break;
            case 'file':
                if (campo.files.length > 0) {
                    const archivo = campo.files[0];
                    const extensionesPermitidas = /(\.|\/)(pdf|jpg|jpeg|png)$/i;
                    if (!extensionesPermitidas.test(archivo.name)) {
                        campo.classList.add('is-invalid');
                        if (errorElement) errorElement.textContent = 'Solo se permiten archivos PDF o imágenes (JPG, JPEG, PNG)';
                        return false;
                    }
                    const maxSize = 5 * 1024 * 1024; // 5MB
                    if (archivo.size > maxSize) {
                        campo.classList.add('is-invalid');
                        if (errorElement) errorElement.textContent = 'El archivo no debe superar los 5MB';
                        return false;
                    }
                }
                break;
        }
        if (nombre === 'run' && !validarRUN(valor)) {
            campo.classList.add('is-invalid');
            if (errorElement) errorElement.textContent = 'Ingrese un RUN válido (ej: 12.345.678-9)';
            return false;
        }
    }
    return true;
}
// Función para actualizar las comunas según la región seleccionada
function actualizarComunas(regionSeleccionada) {
    console.log('Actualizando comunas para región:', regionSeleccionada);
    const selectComuna = document.getElementById('comuna');
    if (!selectComuna) {
        console.error('No se encontró el elemento select de comuna');
        return;
    }
    
    // Limpiar opciones existentes
    $(selectComuna).empty().append(new Option('Seleccione una comuna', ''));
    
    // Si no hay región seleccionada, deshabilitar comuna y salir
    if (!regionSeleccionada) {
        console.log('No hay región seleccionada, deshabilitando comuna');
        selectComuna.disabled = true;
        $(selectComuna).prop('disabled', true).val(null).trigger('change');
        return;
    }
    
    // Filtrar comunas por región seleccionada
    const comunasDeRegion = regionesComunasData
        .filter(item => item['Región'] === regionSeleccionada)
        .map(item => item['Comuna']);
    
    console.log('Comunas encontradas para', regionSeleccionada + ':', comunasDeRegion.length);
    
    // Si no hay comunas para la región, deshabilitar y salir
    if (comunasDeRegion.length === 0) {
        console.log('No se encontraron comunas para la región seleccionada');
        selectComuna.disabled = true;
        $(selectComuna).prop('disabled', true).val(null).trigger('change');
        return;
    }
    
    // Agregar comunas al select
    comunasDeRegion.forEach(comuna => {
        const option = new Option(comuna, comuna);
        selectComuna.add(option);
    });
    
    // Habilitar el select de comuna
    selectComuna.disabled = false;
    $(selectComuna).prop('disabled', false).trigger('change');
    
    console.log('Comunas cargadas en el select:', selectComuna.options.length);
    
    // Forzar actualización de Select2
    $(selectComuna).trigger('change.select2');
}

// Función para cargar las nacionalidades desde el archivo JSON y poblar los selects de país
async function cargarNacionalidades() {
    try {
        const response = await fetch('assets/paises.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo de nacionalidades');
        }
        const paises = await response.json();
        const selectNacionalidad = document.getElementById('nacionalidad');
        const selectPaisResidencia = document.getElementById('paisResidencia');
        
        // Ordenar países alfabéticamente
        
        // Función para agregar opciones a un select
        function poblarSelect(selectElement) {
            // Limpiar opciones existentes excepto la primera
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }
            
            // Agregar cada país al select
            paises.forEach(pais => {
                const option = document.createElement('option');
                option.value = pais.País; // Guardar el nombre completo del país
                option.textContent = pais.País;
                selectElement.appendChild(option);
            });
            
            // Inicializar/actualizar Select2
            $(selectElement).trigger('change.select2');
        }
        
        // Poblar ambos selects
        poblarSelect(selectNacionalidad);
        // Inicializar Select2 para nacionalidad
        $(selectNacionalidad).select2({
            placeholder: 'Seleccione una opción',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body'),
            minimumResultsForSearch: 0
        });
        poblarSelect(selectPaisResidencia);
        // Inicializar Select2 para país de residencia
        $(selectPaisResidencia).select2({
            placeholder: 'Seleccione un país',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body'),
            minimumResultsForSearch: 0
        });
        
        // Inicializar Select2 para país de residencia (igual que nacionalidad)
        $(selectPaisResidencia).select2({
            placeholder: 'Seleccione un país',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body'),
            minimumResultsForSearch: 0
        });
        // Forzar actualización visual de Select2 para país de residencia
        $(selectPaisResidencia).trigger('change.select2');
        $(selectPaisResidencia).select2('close');
        
        // Configurar la visibilidad condicional después de cargar las nacionalidades
        configurarVisibilidadCondicional();
    } catch (error) {
        console.error('Error al cargar las nacionalidades:', error);
        // Mostrar mensaje de error al usuario
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = 'No se pudieron cargar las nacionalidades. Por favor, recargue la página.';
        document.querySelector('.form-container').prepend(errorDiv);
    }
}

// Función para configurar la visibilidad condicional de los campos de documento
function configurarVisibilidadCondicional() {
    const nacionalidadSelect = document.getElementById('nacionalidad');
    const tipoDocumentoSelect = document.getElementById('tipoDocumento');
    const tipoDocumentoContainer = document.getElementById('tipoDocumentoContainer');
    const idOrigenContainer = document.getElementById('idOrigenContainer');
    const runContainer = document.getElementById('runContainer');
    
    // Función para actualizar la visibilidad de los campos
    function actualizarVisibilidadCampos() {
        console.log('Actualizando visibilidad de campos...');
        
        // Obtener el valor de la nacionalidad del Select2
        const nacionalidad = nacionalidadSelect ? ($('#nacionalidad').val() || '').toLowerCase() : '';
        const tipoDocumento = tipoDocumentoSelect ? ($('#tipoDocumento').val() || '') : '';
        // Limpiar campos RUN y N° ID Origen cada vez que se cambia nacionalidad o tipo de documento
        const runInput = document.getElementById('run');
        const idOrigenInput = document.getElementById('idOrigen');
        if (runInput) runInput.value = '';
        if (idOrigenInput) idOrigenInput.value = '';
        
        console.log('Nacionalidad seleccionada:', nacionalidad);
        console.log('Tipo de documento seleccionado:', tipoDocumento);
        
        // Ocultar todos los campos condicionales inicialmente
        [tipoDocumentoContainer, idOrigenContainer, runContainer].forEach(container => {
            if (container) container.style.display = 'none';
        });
        
        // Si no hay nacionalidad seleccionada, no mostrar nada más
        if (!nacionalidad) {
            console.log('No hay nacionalidad seleccionada, ocultando campos condicionales');
            return;
        }
        
        // Si la nacionalidad es Chile, mostrar solo el RUN
        if (nacionalidad.includes('chile')) {
            console.log('Nacionalidad Chile detectada, mostrando solo RUN');
            if (runContainer) runContainer.style.display = 'block';
            // Hacer que el RUN sea obligatorio
            const runInput = document.getElementById('run');
            if (runInput) runInput.required = true;
            
            // Limpiar y hacer no requeridos los otros campos
            if (tipoDocumentoSelect) {
                // Solo cambiar y disparar el evento si el valor no es null o vacío
                if ($('#tipoDocumento').val() !== null && $('#tipoDocumento').val() !== '') {
                    $('#tipoDocumento').val(null).trigger('change');
                }
                tipoDocumentoSelect.required = false;
            }
            const idOrigenInput = document.getElementById('idOrigen');
            if (idOrigenInput) idOrigenInput.required = false;
        } 
        // Para otras nacionalidades
        else {
            console.log('Otra nacionalidad detectada, mostrando selector de tipo de documento');
            // Mostrar el selector de tipo de documento
            if (tipoDocumentoContainer) tipoDocumentoContainer.style.display = 'block';
            
            // Si ya se seleccionó un tipo de documento, mostrar el campo correspondiente
            if (tipoDocumento) {
                console.log('Tipo de documento seleccionado:', tipoDocumento);
                if (tipoDocumento === 'run-chileno') {
                    if (runContainer) runContainer.style.display = 'block';
                    const runInput = document.getElementById('run');
                    if (runInput) runInput.required = true;
                    const idOrigenInput = document.getElementById('idOrigen');
                    if (idOrigenInput) idOrigenInput.required = false;
                } else {
                    if (idOrigenContainer) idOrigenContainer.style.display = 'block';
                    const idOrigenInput = document.getElementById('idOrigen');
                    if (idOrigenInput) idOrigenInput.required = true;
                    const runInput = document.getElementById('run');
                    if (runInput) runInput.required = false;
                }
            }
        }
    }
    
    // Configurar eventos
    if (nacionalidadSelect) {
        // Usar el evento de Select2 para detectar cambios
        $('#nacionalidad').on('change', function() {
            console.log('Cambio detectado en nacionalidad');
            actualizarVisibilidadCampos();
        });
    }
    
    if (tipoDocumentoSelect) {
        // Usar el evento de Select2 para detectar cambios
        $('#tipoDocumento').on('change', function() {
            console.log('Cambio detectado en tipo de documento');
            actualizarVisibilidadCampos();
        });
    }
    
    // Inicializar visibilidad
    actualizarVisibilidadCampos();
}

// Variable para el índice actual del carrusel
let currentIndex = 0;

// Objeto para rastrear archivos subidos
const documentosSubidos = {
    identidad: null,
    sucesion: null, // Cambiado para un solo archivo
    apoderado: null,
    // firmados: {
    //     solicitud: null,
    //     mandato: null
    // },
    // Verificar si todos los documentos requeridos están completos
    estaCompleto: function() {
        // Verificar documento de identidad
        if (!this.identidad) return false;
        // Verificar documentos de sucesión (si aplica)
        const tieneSucesion = document.getElementById('tieneSucesion')?.checked;
        if (tieneSucesion && this.sucesion.length === 0) return false;
        // Verificar documentos de apoderado (si aplica)
        const tieneApoderado = document.getElementById('tieneApoderado')?.checked;
        if (tieneApoderado && !this.apoderado) return false;
        // // Verificar documentos firmados
        // if (!this.firmados.solicitud || !this.firmados.mandato) return false;
        return true;
    }
};

// Inicialización de la aplicación cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async function() {
    // Inicializar el resumen de documentos cuando se muestre la sección
    document.addEventListener('showSection', function(event) {
        if (event.detail.sectionId === 'documentosSubidos') {
            actualizarResumenDocumentos();
        }
    });
    // Variables globales para el formulario
    const fileNameElement = document.querySelector('.file-name');
    
    // Ocultar todas las secciones excepto la primera
    document.querySelectorAll('.form-section').forEach((section, index) => {
        if (index !== 0) {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
            section.classList.add('active');
        }
    });
    
    // Inicializar el carrusel de progreso
    inicializarCarruselProgreso();
    
    // Inicializar contador de caracteres para observaciones
    const textareaObservaciones = document.getElementById('observacionesDerechos');
    const contadorDerechos = document.getElementById('contadorDerechos');
    
    if (textareaObservaciones && contadorDerechos) {
        // Actualizar contador al cargar la página
        contadorDerechos.textContent = textareaObservaciones.value.length;
        
        // Actualizar contador al escribir
        textareaObservaciones.addEventListener('input', function() {
            contadorDerechos.textContent = this.value.length;
        });
        
        // Añadir clase cuando el textarea tiene foco
        textareaObservaciones.addEventListener('focus', function() {
            this.closest('.textarea-container').classList.add('focused');
        });
        
        textareaObservaciones.addEventListener('blur', function() {
            this.closest('.textarea-container').classList.remove('focused');
        });
    }
    
    // Validar checkboxes de derechos al cambiar
    const checkboxesDerechos = document.querySelectorAll('#derechosAdministrar .form-check-input');
    const mensajeValidacion = document.getElementById('derechosValidationMessage');
    
    // Añadir efecto visual a los checkboxes
    checkboxesDerechos.forEach(checkbox => {
        // Añadir clase al contenedor cuando el checkbox cambia
        checkbox.addEventListener('change', function() {
            const card = this.closest('.derecho-card');
            if (this.checked) {
                card.classList.add('checked');
            } else {
                card.classList.remove('checked');
            }
            validarCheckboxesDerechos();
        });
        
        // Inicializar estado de las tarjetas
        const card = checkbox.closest('.derecho-card');
        if (checkbox.checked) {
            card.classList.add('checked');
        }
    });
    
    // Función para validar los checkboxes
    function validarCheckboxesDerechos() {
        const checkboxes = Array.from(document.querySelectorAll('#derechosAdministrar .form-check-input'));
        const todosMarcados = checkboxes.every(checkbox => checkbox.checked);
        
        // Mostrar/ocultar mensaje de validación
        if (mensajeValidacion) {
            if (todosMarcados) {
                mensajeValidacion.classList.remove('show');
            } else {
                mensajeValidacion.classList.add('show');
            }
        }
        
        // Habilitar/deshabilitar botón de siguiente
        const botonSiguiente = document.querySelector('.btn-siguiente');
        if (botonSiguiente) {
            const currentSection = document.querySelector('.form-section.active');
            if (currentSection && currentSection.id === 'derechosAdministrar') {
                botonSiguiente.disabled = !todosMarcados;
                
                // Añadir clase al botón según el estado
                if (todosMarcados) {
                    botonSiguiente.classList.remove('btn-disabled');
                } else {
                    botonSiguiente.classList.add('btn-disabled');
                }
            }
        }
        
        return todosMarcados;
    }
    
    // Validar al cargar la página
    validarCheckboxesDerechos();
    
    // Inicializar funcionalidad de documentos a firmar
    document.addEventListener('DOMContentLoaded', function() {
        inicializarDocumentosFirmar();
    });
    
    // También inicializar cuando se muestre la sección
    document.addEventListener('showSection', function(e) {
        if (e.detail && e.detail.sectionId === 'documentosFirmar') {
            inicializarDocumentosFirmar();
        }
    });
    
    // Validar antes de enviar el formulario
    const formElement = document.querySelector('form');
    if (formElement) {
        formElement.addEventListener('submit', async function(e) {
            if (formularioEnviado) return;
            formularioEnviado = true;
            const currentSection = document.querySelector('.form-section.active');
            
            // Validar sección de derechos
            if (currentSection && currentSection.id === 'derechosAdministrar') {
                if (!validarCheckboxesDerechos()) {
                    e.preventDefault();
                    mensajeValidacion.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            // Validar sección de documentos a firmar
            if (currentSection && currentSection.id === 'documentosFirmar') {
                if (!validarDocumentosFirmar()) {
                    e.preventDefault();
                    document.getElementById('documentosValidationMessage').scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            }
            
            // === ENVÍO DE FORMULARIO A WEBHOOK (Power Automate) ===
            // Este bloque se ubica justo antes del cierre del eventListener 'submit' del formulario principal
            const webhookUrl = "https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/95768cafc46c445081fca1472c94358a/triggers/manual/paths/invoke/?api-version=1&tenantId=tId&environmentName=Default-0c130962-09bc-40fc-8db8-9d043ff6251a&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dpXhd5GjJypNhprFHE1nGChVyPcxqM6xYvpNhwOOkm8"; // <-- Webhook real

            if (currentSection && currentSection.id === 'documentosSubidos') {
                e.preventDefault();
                // === EXTRACCIÓN DE TODOS LOS CAMPOS ===
                // Datos personales
                const nombres = document.getElementById('nombres')?.value.trim() || '';
                const apellidoPaterno = document.getElementById('apellidoPaterno')?.value.trim() || '';
                const apellidoMaterno = document.getElementById('apellidoMaterno')?.value.trim() || '';
                const nacionalidad = document.getElementById('nacionalidad')?.value || '';
                let tipoDocumento = document.getElementById('tipoDocumento')?.value || '';
                if (nacionalidad.trim().toLowerCase() === 'chile') {
                    tipoDocumento = 'RUT';
                }
                const run = document.getElementById('run')?.value.trim() || '';
                const idOrigen = document.getElementById('idOrigen')?.value.trim() || '';
                // Formatear fechas a dd-mm-yyyy
                function formatearFecha(fechaStr) {
                    if (!fechaStr) return '';
                    const partes = fechaStr.split('-');
                    if (partes.length !== 3) return fechaStr;
                    return `${partes[2]}-${partes[1]}-${partes[0]}`;
                }
                const fechaNacimiento = formatearFecha(document.getElementById('fechaNacimiento')?.value || '');
                const fechaDefuncion = formatearFecha(document.getElementById('fechaDefuncion')?.value || '');
                const genero = document.getElementById('genero')?.value || '';
                const seudonimo = document.getElementById('seudonimo')?.value.trim() || '';

                // Contacto
                const paisResidencia = document.getElementById('paisResidencia')?.value || '';
                const region = document.getElementById('region')?.value || '';
                const comuna = document.getElementById('comuna')?.value || '';
                const direccion = document.getElementById('direccion')?.value.trim() || '';
                const detalleDireccion = document.getElementById('detalleDireccion')?.value.trim() || '';
                const email = document.getElementById('email')?.value.trim() || '';
                const codigoPais = document.getElementById('codigoPais')?.value || '';
                const telefonoSolo = document.getElementById('telefono')?.value.trim() || '';
                const telefono = (codigoPais && telefonoSolo) ? (codigoPais + ' ' + telefonoSolo) : (telefonoSolo || codigoPais);

                // Apoderado
                const apoderadoNombres = document.getElementById('apoderadoNombres')?.value.trim() || '';
                const apoderadoApellidoPaterno = document.getElementById('apoderadoApellidoPaterno')?.value.trim() || '';
                const apoderadoApellidoMaterno = document.getElementById('apoderadoApellidoMaterno')?.value.trim() || '';
                const apoderadoEmail = document.getElementById('apoderadoEmail')?.value.trim() || '';
                const apoderadoRun = document.getElementById('apoderadoRun')?.value.trim() || '';
                let apoderadoCodigoPais = document.getElementById('apoderadoCodigoPais')?.value || '';
                const apoderadoTelefonoSolo = document.getElementById('apoderadoTelefono')?.value.trim() || '';
                const apoderadoTelefono = (apoderadoCodigoPais && apoderadoTelefonoSolo) ? (apoderadoCodigoPais + ' ' + apoderadoTelefonoSolo) : (apoderadoTelefonoSolo || apoderadoCodigoPais);
                if (!apoderadoTelefonoSolo) apoderadoCodigoPais = '';

                // Sucesión
                const sucesionNombres = document.getElementById('sucesionNombres')?.value.trim() || '';
                const sucesionApellidoPaterno = document.getElementById('sucesionApellidoPaterno')?.value.trim() || '';
                const sucesionApellidoMaterno = document.getElementById('sucesionApellidoMaterno')?.value.trim() || '';
                const sucesionEmail = document.getElementById('sucesionEmail')?.value.trim() || '';
                let sucesionCodigoPais = document.getElementById('sucesionCodigoPais')?.value || '';
                const sucesionTelefonoSolo = document.getElementById('sucesionTelefono')?.value.trim() || '';
                const sucesionTelefono = (sucesionCodigoPais && sucesionTelefonoSolo) ? (sucesionCodigoPais + ' ' + sucesionTelefonoSolo) : (sucesionTelefonoSolo || sucesionCodigoPais);
                if (!sucesionTelefonoSolo) sucesionCodigoPais = '';

                // Datos Técnicos
                const ambitos = [];
                const ambitoAudiovisual = document.getElementById('ambitoAudiovisual')?.value;
                const ambitoDramatico = document.getElementById('ambitoDramatico')?.value;
                if (ambitoAudiovisual) ambitos.push(ambitoAudiovisual);
                if (ambitoDramatico) ambitos.push(ambitoDramatico);
                // Observaciones
                const observaciones = document.getElementById('observacionesDerechos')?.value.trim() || '';

                // Clase (array de checkboxes seleccionados)
                const clases = Array.from(document.querySelectorAll('input[name="clase[]"]:checked')).map(cb => cb.value);

                // Sociedad
                let perteneceSociedad = document.querySelector('input[name="perteneceSociedad"]:checked')?.value || '';
                if (perteneceSociedad === 'si') perteneceSociedad = 'Sí';
                else if (perteneceSociedad === 'no') perteneceSociedad = 'No';
                const sociedadPais = document.getElementById('sociedadPais')?.value || '';
                const sociedadNombre = document.getElementById('sociedadNombre')?.value || '';

                // === FECHA Y HORA DE POSTULACIÓN (invisible para el usuario) ===
                // Santiago de Chile UTC-4
                const fechaHoraPostulacion = new Date().toLocaleString('es-CL', {
                    timeZone: 'America/Santiago',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                // === GENERAR PDF DEL FORMULARIO COMO BASE64 ===
                const formContainer = document.querySelector('.form-container');
                let screenshot_pdf = null;
                if (formContainer && window.jspdf && window.html2canvas) {
                    // Guardar el estado original de las secciones
                    const secciones = Array.from(document.querySelectorAll('.form-section'));
                    const estadoOriginal = secciones.map(sec => ({
                        id: sec.id,
                        display: sec.style.display,
                        active: sec.classList.contains('active')
                    }));

                    // Mostrar todas las secciones
                    secciones.forEach(sec => {
                        sec.style.display = 'block';
                        sec.classList.remove('active');
                    });

                    await html2canvas(formContainer, {scale:2, useCORS:true}).then(canvas => {
                        // Usar JPEG y calidad media
                        const imgData = canvas.toDataURL('image/jpeg', 0.5);
                        const pdf = new window.jspdf.jsPDF({unit: 'px', format: 'a4'});
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const pageHeight = pdf.internal.pageSize.getHeight();
                        const imgWidth = canvas.width;
                        const imgHeight = canvas.height;
                        const ratio = pageWidth / imgWidth;
                        const scaledHeight = imgHeight * ratio;
                        let position = 0;

                        // Primera página
                        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, scaledHeight);
                        position -= pageHeight;

                        // Corregido: asegurar que la última parte siempre se incluya
                        while (Math.abs(position) < scaledHeight) {
                            if (Math.abs(position) + pageHeight < scaledHeight) {
                                pdf.addPage();
                                pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, scaledHeight);
                            } else {
                                // Si queda un resto, agregar una última página para el final
                                if (scaledHeight - Math.abs(position) > 0) {
                                    pdf.addPage();
                                    pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, scaledHeight);
                                }
                                break;
                            }
                            position -= pageHeight;
                        }
                        // Validar tamaño del PDF antes de enviar (máx 4 MB)
                        const pdfBase64 = pdf.output('datauristring').split(',')[1];
                        const pdfSizeMB = (pdfBase64.length * 3 / 4) / (1024 * 1024);
                        if (pdfSizeMB > 4) {
                            mostrarNotificacion('El PDF generado es demasiado grande (' + pdfSizeMB.toFixed(2) + ' MB). Por favor, revisa el contenido del formulario o contacta soporte.', 'error');
                            screenshot_pdf = null;
                        } else {
                            screenshot_pdf = {
                                nombre: 'Formulario-Postulacion-ATN.pdf',
                                contenido: pdfBase64
                            };
                        }
                    });

                    // Restaurar el estado original de las secciones
                    estadoOriginal.forEach(({id, display, active}) => {
                        const sec = document.getElementById(id);
                        if (sec) {
                            sec.style.display = display;
                            if (active) {
                                sec.classList.add('active');
                            } else {
                                sec.classList.remove('active');
                            }
                        }
                    });
                }

                // === BACKUP ===
                const paisResidenciaBackup = document.getElementById('paisResidenciaBackup')?.value.trim() || '';
                const regionBackup = document.getElementById('regionBackup')?.value.trim() || '';
                const comunaBackup = document.getElementById('comunaBackup')?.value.trim() || '';
                const estadoBackup = document.getElementById('estadoBackup')?.value.trim() || '';
                const distritoBackup = document.getElementById('distritoBackup')?.value.trim() || '';

                // === EXTRAER DATOS PROFESIONALES ===
                const estudios = Array.from(document.querySelectorAll('input[name="estudios[]"]'))
                    .map(input => input.value.trim()).filter(val => val);
                const docencia = Array.from(document.querySelectorAll('input[name="docencia[]"]'))
                    .map(input => input.value.trim()).filter(val => val);
                const premios = Array.from(document.querySelectorAll('input[name="premios[]"]'))
                    .map(input => input.value.trim()).filter(val => val);
                // Puedes agregar más campos dinámicos si existen, como experienciaLaboral o membresias

                // === EXTRAER OBRAS ===
                const obras = Array.from(document.querySelectorAll('.obra-item')).map(obra => {
                    const titulo = obra.querySelector('input[name="tituloObra[]"]')?.value.trim() || '';
                    const ambitoObra = obra.querySelector('select[name="ambitoObra[]"]')?.value || '';
                    const anioEstreno = obra.querySelector('input[name="anioEstrenoObra[]"]')?.value || '';
                    return (titulo && ambitoObra && anioEstreno) ? { titulo, ambitoObra, anioEstreno } : null;
                }).filter(obra => obra);

                // === DATOS BANCARIOS ===
                const tipoBanco = document.getElementById('tipoBanco')?.value || '';
                let paisBanco = document.getElementById('paisBanco')?.value || '';
                if (tipoBanco.trim().toLowerCase() === 'nacional') {
                    paisBanco = 'Chile';
                }
                const banco = document.getElementById('banco')?.value || '';
                const tipoCuenta = document.getElementById('tipoCuenta')?.value || '';
                const numeroCuenta = document.getElementById('numeroCuenta')?.value || '';
                const bancoLibre = document.getElementById('bancoLibre')?.value || '';
                const direccionBancoExtranjero = document.getElementById('direccionBancoExtranjero')?.value || '';
                const numeroCuentaExtranjero = document.getElementById('numeroCuentaExtranjero')?.value || '';
                const swiftIban = document.getElementById('swiftIban')?.value || '';
                const confirmacionObras = document.getElementById('confirmacionObras')?.checked || false;
                const derechosComunicacion = document.getElementById('derechosComunicacion')?.checked || false;
                const autorizacionDatos = document.getElementById('autorizacionDatos')?.checked || false;

                // Construir el objeto de datos
                const data = {
                    nombres,
                    apellidoPaterno,
                    apellidoMaterno,
                    nacionalidad,
                    tipoDocumento,
                    run,
                    idOrigen,
                    fechaNacimiento,
                    fechaDefuncion,
                    genero,
                    seudonimo,
                    region,
                    comuna,
                    direccion,
                    detalleDireccion,
                    email,
                    codigoPais,
                    telefono,
                    apoderadoNombres,
                    apoderadoApellidoPaterno,
                    apoderadoApellidoMaterno,
                    apoderadoEmail,
                    apoderadoRun, // <-- Añadido aquí
                    apoderadoCodigoPais,
                    apoderadoTelefono,
                    sucesionNombres,
                    sucesionApellidoPaterno,
                    sucesionApellidoMaterno,
                    sucesionEmail,
                    sucesionCodigoPais,
                    sucesionTelefono,
                    ambito: ambitos, // ahora array
                    clase: clases,   // ahora array
                    perteneceSociedad,
                    sociedadPais,
                    sociedadNombre,
                    observaciones,
                    fechaHoraPostulacion,
                    screenshot_pdf,
                    paisResidenciaBackup,
                    regionBackup,
                    comunaBackup,
                    estadoBackup,
                    distritoBackup,
                    // === CAMPOS AGREGADOS ===
                    estudios,
                    docencia,
                    premios,
                    obras,
                    // === DATOS BANCARIOS AL MISMO NIVEL ===
                    tipoBanco,
                    banco,
                    tipoCuenta,
                    numeroCuenta,
                    bancoLibre,
                    paisBanco,
                    direccionBancoExtranjero,
                    numeroCuentaExtranjero,
                    swiftIban,
                    confirmacionObras,
                    derechosComunicacion,
                    autorizacionDatos
                };

                // === ARCHIVOS ===
                // Función para convertir archivo a base64
                function fileToBase64(file) {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result.split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                }

                // Función auxiliar para agregar archivo al data
                async function agregarArchivoAlData(inputId, campoData) {
                    const input = document.getElementById(inputId);
                    if (input && input.files && input.files[0]) {
                        const file = input.files[0];
                        const base64 = await fileToBase64(file);
                        data[campoData] = {
                            nombre: file.name,
                            contenido: base64
                        };
                    }
                }

                // Lista de archivos a procesar
                const archivosAProcesar = [
                    { inputId: 'fotocopiaDocumento', campoData: 'fotocopia_documento_autor' },
                    { inputId: 'apoderadoDocumento', campoData: 'fotocopia_documento_representante' },
                    { inputId: 'sucesionDocumento', campoData: 'documento_sucesion' },
                    { inputId: 'solicitudFirmada', campoData: 'solicitud_incorporacion_firmada' },
                    { inputId: 'mandatoFirmado', campoData: 'mandato_firmado' },
                    { inputId: 'firmaPostulante', campoData: 'firmaElectronica' } // Agregado para la firma electrónica
                ];

                // Procesar todos los archivos antes de enviar
                Promise.all(archivosAProcesar.map(({inputId, campoData}) => agregarArchivoAlData(inputId, campoData))).then(() => {
                    // Mostrar el JSON en consola para verificación
                    console.log('JSON a enviar:', data);
                    
                    // Crear y mostrar la barra de progreso
                    const progressContainer = document.createElement('div');
                    progressContainer.className = 'upload-progress';
                    progressContainer.innerHTML = '<div class="upload-progress-bar"></div>';
                    document.body.appendChild(progressContainer);
                    
                    // Agregar clase de carga al botón
                    const btnEnviar = document.getElementById('btnEnviar');
                    if (btnEnviar) {
                        btnEnviar.classList.add('btn-loading');
                        btnEnviar.textContent = 'Enviando...';
                    }
                    
                    // Simular progreso inicial
                    setTimeout(() => {
                        const progressBar = progressContainer.querySelector('.upload-progress-bar');
                        if (progressBar) progressBar.style.width = '30%';
                    }, 500);
                    
                    // Enviar el JSON al endpoint original
                    fetch('https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/95768cafc46c445081fca1472c94358a/triggers/manual/paths/invoke/?api-version=1&tenantId=tId&environmentName=Default-0c130962-09bc-40fc-8db8-9d043ff6251a&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dpXhd5GjJypNhprFHE1nGChVyPcxqM6xYvpNhwOOkm8', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    .then(res => {
                        // Simular progreso durante la respuesta
                        const progressBar = progressContainer.querySelector('.upload-progress-bar');
                        if (progressBar) progressBar.style.width = '70%';
                        return res.text();
                    })
                    .then(resp => {
                        // Completar la barra de progreso
                        progressContainer.classList.add('complete');
                        const progressBar = progressContainer.querySelector('.upload-progress-bar');
                        if (progressBar) progressBar.style.width = '100%';
                        // Remover la barra de progreso después de un delay
                        setTimeout(() => {
                            if (progressContainer.parentNode) {
                                progressContainer.parentNode.removeChild(progressContainer);
                            }
                        }, 1000);
                        // Restaurar el botón y mostrar mensaje de éxito
                        if (btnEnviar) {
                            btnEnviar.classList.remove('btn-loading');
                            btnEnviar.disabled = true;
                            btnEnviar.textContent = 'Formulario Enviado';
                        }
                        mostrarNotificacion('¡Formulario enviado correctamente! Su postulación ha sido recibida.', 'success');
                        setTimeout(() => {
                            window.location.href = 'exito.html';
                        }, 1200);
                    })
                    .catch(err => {
                        // Remover la barra de progreso en caso de error
                        if (progressContainer.parentNode) {
                            progressContainer.parentNode.removeChild(progressContainer);
                        }
                        // Restaurar el botón en caso de error
                        if (btnEnviar) {
                            btnEnviar.classList.remove('btn-loading');
                            btnEnviar.textContent = 'Enviar Solicitud';
                        }
                        mostrarNotificacion('Error al enviar el formulario. Por favor, inténtelo nuevamente.', 'error');
                        console.error(err);
                        // Rehabilitar el formulario en caso de error
                        formularioEnviado = false;
                    });

                    // Enviar el JSON al segundo endpoint de Power Automate
                    fetch('https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/8e2f566122c444208c17314bc9ad0508/triggers/manual/paths/invoke/?api-version=1&tenantId=tId&environmentId=Default-0c130962-09bc-40fc-8db8-9d043ff6251a&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8kDY_BftmB173PBJpvYr28-1hr8TTgdQmLELfxsXONA', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    .then(res => res.text())
                    .then(resp => {
                        // Opcional: puedes poner logs o acciones adicionales aquí
                        console.log('Segundo flujo Power Automate ejecutado correctamente');
                    })
                    .catch(err => {
                        console.error('Error en el segundo flujo Power Automate:', err);
                    });
                });
            }
        });
    }
    
    // Función para inicializar la funcionalidad de documentos a firmar
    function inicializarDocumentosFirmar() {
        console.log('Inicializando documentos a firmar...');
        
        // Inicializar el panel de instrucciones desplegable
        const instructionHeader = document.querySelector('.instruction-header');
        if (instructionHeader) {
            // Abrir instrucciones por defecto
            instructionHeader.setAttribute('aria-expanded', 'true');
            document.getElementById('instruccionesDetalladas').classList.add('show');
            instructionHeader.addEventListener('click', function() {
                const content = document.getElementById('instruccionesDetalladas');
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !isExpanded);
                content.classList.toggle('show', !isExpanded);
                // Guardar el estado en localStorage para recordar la preferencia del usuario
                localStorage.setItem('instruccionesExpandidas', !isExpanded);
            });
            // Cargar el estado guardado
            const savedState = localStorage.getItem('instruccionesExpandidas');
            if (savedState !== null) {
                const expanded = savedState === 'true';
                instructionHeader.setAttribute('aria-expanded', expanded);
                document.getElementById('instruccionesDetalladas').classList.toggle('show', expanded);
            }
        }
        
        // Configurar descargas de documentos
        const descargarSolicitud = document.getElementById('descargarSolicitud');
        const descargarMandato = document.getElementById('descargarMandato');
        
        // Configurar eventos de descarga
        if (descargarSolicitud) {
            // Remover cualquier event listener existente
            const newSolicitud = descargarSolicitud.cloneNode(true);
            descargarSolicitud.parentNode.replaceChild(newSolicitud, descargarSolicitud);
            
            // Agregar el event listener al nuevo elemento
            newSolicitud.addEventListener('click', function(e) {
                e.preventDefault();
                const url = 'https://atncl.odoo.com/sign/document/mail/37/9c28ec69-bf8a-4939-b06c-007ee18fc252';
                window.open(url, '_blank');
            });
        }
        
        if (descargarMandato) {
            // Remover cualquier event listener existente
            const newMandato = descargarMandato.cloneNode(true);
            descargarMandato.parentNode.replaceChild(newMandato, descargarMandato);
            
            // Agregar el event listener al nuevo elemento
            newMandato.addEventListener('click', function(e) {
                e.preventDefault();
                const url = 'https://atncl.odoo.com/sign/document/mail/39/e804bb0b-8cca-4bab-a128-1b9a2587fd35';
                window.open(url, '_blank');
            });
        }
        
        // Configurar subida de archivos
        const fileInputs = document.querySelectorAll('.documento-upload-input');
        console.log('Inputs de archivo encontrados:', fileInputs.length);
        
        fileInputs.forEach(input => {
            console.log('Configurando input:', input.id);
            
            // Crear un nuevo input para limpiar cualquier event listener existente
            const newInput = input.cloneNode(true);
            
            // Reemplazar el input existente con el clon
            input.parentNode.replaceChild(newInput, input);
            
            // Agregar el event listener al nuevo input
            newInput.addEventListener('change', function(e) {
                console.log('Archivo seleccionado en', this.id, ':', this.files);
                manejarSubidaArchivo(this);
            });
            
            // Agregar un manejador de clic para forzar la apertura del selector de archivos
            const uploadButton = newInput.nextElementSibling;
            if (uploadButton && uploadButton.classList.contains('documento-upload-button')) {
                uploadButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation(); // Detener la propagación para evitar el doble clic
                    newInput.click();
                });
            }
        });
        
        // Configurar botones de eliminar
        function configurarBotonesEliminar() {
            const deleteButtons = document.querySelectorAll('.btn-eliminar-doc');
            console.log('Configurando botones de eliminar. Encontrados:', deleteButtons.length);
            
            deleteButtons.forEach(btn => {
                // Si el botón ya tiene un manejador de eventos, saltar
                if (btn.hasAttribute('data-initialized')) {
                    return;
                }
                
                const targetId = btn.getAttribute('data-target');
                if (!targetId) {
                    console.error('Botón de eliminar sin data-target:', btn);
                    return;
                }
                
                console.log('Configurando botón eliminar para:', targetId);
                
                // Marcar como inicializado
                btn.setAttribute('data-initialized', 'true');
                
                // Agregar el event listener al botón
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('Eliminando archivo para input:', targetId);
                    
                    // Limpiar el input de archivo
                    const targetInput = document.getElementById(targetId);
                    if (targetInput) {
                        targetInput.value = '';
                        console.log('Input limpiado:', targetId);
                    }
                    
                    // Encontrar el contenedor padre que tiene tanto el nombre como el botón
                    const infoDiv = btn.closest('.documento-info');
                    if (infoDiv) {
                        const nombreElemento = infoDiv.querySelector('.documento-nombre');
                        if (nombreElemento) {
                            nombreElemento.textContent = 'Ningún archivo seleccionado';
                            console.log('Texto actualizado a "Ningún archivo seleccionado"');
                        }
                        
                        // Ocultar el botón de eliminar
                        btn.style.display = 'none';
                        console.log('Botón de eliminar ocultado');
                    } else {
                        console.error('No se encontró el contenedor de información para:', targetId);
                    }
                    
                    // Actualizar el estado en el objeto de seguimiento
                    if (targetId === 'solicitudFirmada') {
                        documentosSubidos.firmados.solicitud = null;
                    } else if (targetId === 'mandatoFirmado') {
                        documentosSubidos.firmados.mandato = null;
                    }
                    
                    // Actualizar el resumen de documentos
                    actualizarResumenDocumentos();
                    
                    console.log('Estado actualizado en documentosSubidos:', documentosSubidos);
                    
                    // Actualizar la validación
                    validarDocumentosFirmar();
                });
            });
        }
        
        // Configurar los botones de eliminar inicialmente
        configurarBotonesEliminar();
        
        // Función para manejar la subida de archivos
        function manejarSubidaArchivo(input) {
            if (!input.files || !input.files[0]) return;
            
            const file = input.files[0];
            const fileName = file.name;
            const fileSize = (file.size / (1024 * 1024)).toFixed(2); // Tamaño en MB
            const fileType = file.type;
            const inputId = input.id;
            
            console.log('Procesando archivo:', fileName, 'en input:', inputId);
            console.log('Procesando archivo:', fileName, 'Tipo:', fileType, 'Tamaño:', fileSize, 'MB');
            
            // Solo validar PDF en los campos de documentos firmados
            if (inputId === 'solicitudFirmada' || inputId === 'mandatoFirmado') {
                if (fileType !== 'application/pdf') {
                    mostrarError(input.id, 'Por favor, suba un archivo en formato PDF.');
                    input.value = '';
                    return;
                }
                // Validar tamaño del archivo (máximo 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    mostrarError(input.id, 'El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
                    input.value = '';
                    return;
                }
            }
            // Limpiar cualquier mensaje de error
            const errorElement = document.getElementById(`error${input.id}`);
            if (errorElement) {
                errorElement.textContent = '';
            }
            
            // Construir el ID del contenedor de información
            const infoDivId = 'info' + input.id.replace('Firmada', '').replace('Firmado', '');
            console.log('Buscando infoDiv con ID:', infoDivId);
            
            // Buscar el elemento por ID de forma insensible a mayúsculas/minúsculas
            let infoDiv = null;
            const allElements = document.querySelectorAll('[id]');
            for (let element of allElements) {
                if (element.id.toLowerCase() === infoDivId.toLowerCase()) {
                    infoDiv = element;
                    break;
                }
            }
            
            if (infoDiv) {
                console.log('InfoDiv encontrada:', infoDiv);
                
                // Actualizar el nombre del archivo
                const fileNameElement = infoDiv.querySelector('.documento-nombre');
                if (fileNameElement) {
                    fileNameElement.textContent = `${fileName} (${fileSize} MB)`;
                    console.log('Texto actualizado en:', fileNameElement);
                } else {
                    console.error('No se encontró el elemento .documento-nombre');
                    return;
                }
                
                // Mostrar el botón de eliminar
                const deleteButton = infoDiv.querySelector('.btn-eliminar-doc');
                if (deleteButton) {
                    deleteButton.style.display = 'inline-flex';
                    deleteButton.style.visibility = 'visible';
                    console.log('Botón de eliminar mostrado');
                }
                
                // Actualizar el objeto de seguimiento
                const fileInfo = {
                    nombre: file.name,
                    tamano: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                    tipo: inputId === 'solicitudFirmada' ? 'Solicitud de Incorporación' : 'Mandato Especial',
                    archivo: file,
                    fechaSubida: new Date().toLocaleString()
                };
                
                if (inputId === 'solicitudFirmada') {
                    documentosSubidos.firmados.solicitud = fileInfo;
                    console.log('Solicitud de incorporación subida:', fileInfo);
                } else if (inputId === 'mandatoFirmado') {
                    documentosSubidos.firmados.mandato = fileInfo;
                    console.log('Mandato especial subido:', fileInfo);
                }
                
                // Actualizar la interfaz de usuario (usando el infoDiv ya encontrado)
                if (infoDiv) {
                    const nombreElemento = infoDiv.querySelector('.documento-nombre');
                    if (nombreElemento) {
                        nombreElemento.textContent = `${file.name} (${fileInfo.tamano})`;
                    }
                    
                    const deleteBtn = infoDiv.querySelector('.btn-eliminar-doc');
                    if (deleteBtn) {
                        deleteBtn.style.display = 'inline-flex';
                    }
                }
                
                // Actualizar el resumen de documentos
                actualizarResumenDocumentos();
                
                // Actualizar la validación
                validarDocumentosFirmar();
                
                console.log('Documento subido actualizado en documentosSubidos:', documentosSubidos);
                
                // Actualizar la validación
                validarDocumentosFirmar();
                
                // Asegurarse de que el botón tenga el manejador de eventos
                configurarBotonesEliminar();
            } else {
                console.error('No se encontró el contenedor de información para el archivo');
            }
        }
    }
    
    // Función para mostrar errores de validación
    function mostrarError(inputId, mensaje) {
        const errorElement = document.getElementById(`error${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`);
        if (errorElement) {
            errorElement.textContent = mensaje;
        }
    }
    
    // Función para validar documentos a firmar
    function validarDocumentosFirmar() {
        const solicitud = document.getElementById('solicitudFirmada');
        const mandato = document.getElementById('mandatoFirmado');
        const mensajeValidacion = document.getElementById('documentosValidationMessage');
        let valido = true;

        if (mensajeValidacion) {
            mensajeValidacion.style.display = 'none';
        }

        // Validar solicitud
        if (!solicitud || !solicitud.files || solicitud.files.length === 0) {
            mostrarError('solicitudFirmada', 'Por favor, suba la solicitud firmada');
            valido = false;
        }

        // Validar mandato
        if (!mandato || !mandato.files || mandato.files.length === 0) {
            mostrarError('mandatoFirmado', 'Por favor, suba el mandato firmado');
            valido = false;
        }

        // Limpiar error de firma si no es obligatoria
        const firmaError = document.getElementById('errorFirmaPostulante');
        if (firmaError) firmaError.textContent = '';

        if (!valido && mensajeValidacion) {
            mensajeValidacion.style.display = 'flex';
            mensajeValidacion.querySelector('span').textContent = 'Debe subir ambos documentos firmados para continuar con la postulación.';
        }

        return valido;
    }
    
    // Inicializar Select2 para los campos de selección
    $('.select2').select2({
        placeholder: 'Seleccione una opción',
        allowClear: true,
        width: '100%',
        dropdownParent: $('body')
    });
    
    // Cargar datos iniciales
    await cargarNacionalidades();
    
    // Configurar manejador de eventos para el campo de región
    const selectRegion = document.getElementById('region');
    if (selectRegion) {
        // Inicializar Select2 específicamente para región
        $(selectRegion).select2({
            placeholder: 'Seleccione una región',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body')
        });
        
        // Agregar manejador de cambio
        $(selectRegion).on('change', function() {
            actualizarComunas($(this).val());
        });
    }
    
    // Inicializar Select2 para comuna
    const selectComuna = document.getElementById('comuna');
    if (selectComuna) {
        $(selectComuna).select2({
            placeholder: 'Seleccione una comuna',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body'),
            disabled: true
        });
    }
    
    // La visibilidad condicional se configura después de cargar las nacionalidades

    // Variables globales
    const form = document.getElementById('socioForm');
    const currentSection = document.querySelector('.form-section.active');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const btnAtras = document.getElementById('btnAtras');
    const btnCancelar = document.getElementById('btnCancelar');
    const fileUpload = document.getElementById('fotocopiaDocumento');
    // fileNameElement ya está declarado al inicio de la función
    
    // Referencias a los nuevos campos de contacto
    const paisResidencia = document.getElementById('paisResidencia');
    const region = document.getElementById('region');
    const comuna = document.getElementById('comuna');
    const direccion = document.getElementById('direccion');
    const email = document.getElementById('email');
    const telefono = document.getElementById('telefono');
    // Declarar containers después de que los elementos existen
    const regionContainer = region ? region.closest('.form-group') : null;
    const comunaContainer = comuna ? comuna.closest('.form-group') : null;
    
    // Manejar cambio en el país de residencia
    if (paisResidencia && region && comuna && regionContainer && comunaContainer) {
        $(paisResidencia).off('change').on('change', async function() {
            const pais = this.value ? this.value.toString().trim().toLowerCase() : '';
            // Limpiar campos Estado, Distrito, Región y Comuna al cambiar país
            const estadoInput = document.getElementById('estado');
            const distritoInput = document.getElementById('distrito');
            const regionSelect = document.getElementById('region');
            const comunaSelect = document.getElementById('comuna');
            if (estadoInput) {
                estadoInput.value = '';
                estadoInput.classList.remove('is-invalid');
                const error = estadoInput.closest('.form-group')?.querySelector('.error-message');
                if (error) error.textContent = '';
            }
            if (distritoInput) {
                distritoInput.value = '';
                distritoInput.classList.remove('is-invalid');
                const error = distritoInput.closest('.form-group')?.querySelector('.error-message');
                if (error) error.textContent = '';
            }
            if (regionSelect) {
                regionSelect.value = '';
                $(regionSelect).trigger('change');
                regionSelect.classList.remove('is-invalid');
                const error = regionSelect.closest('.form-group')?.querySelector('.error-message');
                if (error) error.textContent = '';
            }
            if (comunaSelect) {
                comunaSelect.value = '';
                $(comunaSelect).trigger('change');
                comunaSelect.classList.remove('is-invalid');
                const error = comunaSelect.closest('.form-group')?.querySelector('.error-message');
                if (error) error.textContent = '';
            }
            if (pais === 'chile' || pais.includes('chile')) {
                // Mostrar región y comuna, ocultar estado y distrito
                estadoContainer.style.display = 'none';
                distritoContainer.style.display = 'none';
                regionContainer.style.display = '';
                comunaContainer.style.display = '';
            } else if (pais) {
                // Mostrar estado y distrito, ocultar región y comuna
                estadoContainer.style.display = '';
                distritoContainer.style.display = '';
                regionContainer.style.display = 'none';
                comunaContainer.style.display = 'none';
            } else {
                // Si no hay país seleccionado, ocultar estado y distrito, mostrar región y comuna
                estadoContainer.style.display = 'none';
                distritoContainer.style.display = 'none';
                regionContainer.style.display = '';
            }
        });
    }
    
    // Validación del campo RUN (formato chileno)
    
    
    // Formatear RUN mientras se escribe
    function formatearRUN(input) {
        // Obtener el valor actual, eliminar todo excepto números y K
        let run = input.value.replace(/[^\dKk]/gi, '').toUpperCase();
        
        // Si hay algo para formatear
        if (run.length > 0) {
            // Eliminar ceros al inicio
            run = run.replace(/^0+/, '');
            
            // Si solo queda la K, añadir un 0 delante
            if (run === 'K') {
                run = '0' + run;
            }
            
            // Si el RUN es demasiado largo, truncarlo
            if (run.length > 9) {
                run = run.substring(0, 9);
            }
            
            // Si el último carácter no es K, forzar mayúscula
            if (run.length > 0 && run[run.length - 1].toLowerCase() === 'k') {
                run = run.substring(0, run.length - 1) + 'K';
            }
            
            // Si es un RUN válido (más de 1 dígito y termina en número o K)
            if (run.length > 1 && /\d$/.test(run)) {
                // Separar el DV
                const dv = run.slice(-1);
                let cuerpo = run.slice(0, -1);
                
                // Formatear con puntos
                cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                
                // Unir con guión
                run = `${cuerpo}-${dv}`;
            } else if (run.length > 1 && /[Kk]$/.test(run)) {
                // Si termina en K, asegurarse de que tenga al menos un dígito antes
                const cuerpo = run.slice(0, -1);
                if (cuerpo.length > 0) {
                    // Formatear con puntos
                    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                    run = `${cuerpoFormateado}-K`;
                } else {
                    // Si solo hay una K, dejarla como está
                    run = '0-K';
                }
            }
        }
        
        // Actualizar el valor del input
        input.value = run;
        return run;
    }
    
    // Mover la función validarCampo al scope global, antes de cualquier función que la use
    
    
    // Validar todos los campos de una sección
    function validarSeccion(seccion) {
        let valido = true;
        const campos = seccion.querySelectorAll('input, select, textarea');
        
        campos.forEach(campo => {
            if (!validarCampo(campo)) {
                valido = false;
            }
        });
        
        return valido;
    }
    
    // Mostrar la sección actual
    function mostrarSeccion(idSeccion) {
        // Ocultar todas las secciones
        document.querySelectorAll('.form-section').forEach(seccion => {
            seccion.style.display = 'none';
            seccion.classList.remove('active');
        });
        
        // Mostrar la sección solicitada
        const seccion = document.getElementById(idSeccion);
        if (seccion) {
            seccion.style.display = 'block';
            seccion.classList.add('active');
            
            // Actualizar el índice actual para el carrusel
            const sectionNumber = parseInt(seccion.getAttribute('data-section') || '1');
            actualizarBarraProgreso(sectionNumber);
            
            // Inicializar documentos a firmar si es la sección activa
            if (idSeccion === 'documentosFirmar') {
                inicializarDocumentosFirmar();
            }
            
            setTimeout(() => {
            seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);

            // Limpiar listeners y atributos previos de los botones y contenedores de la sección Datos Generales
            if (idSeccion === 'datosGenerales') {
                // Limpiar atributos data-initialized de los botones de agregar y eliminar
                document.querySelectorAll('#datosGenerales .btn-add-input, #datosGenerales .btn-remove-input').forEach(btn => {
                    btn.removeAttribute('data-initialized');
                });
                // Limpiar listeners clonando los contenedores (esto elimina listeners antiguos)
                document.querySelectorAll('#datosGenerales .dynamic-input-container').forEach(container => {
                    const newContainer = container.cloneNode(true);
                    container.parentNode.replaceChild(newContainer, container);
                });
                inicializarGruposDinamicos();
                datosGeneralesInicializados = true;
                console.log('Grupos dinámicos de Datos Generales inicializados.');
            }
        }
        // Mostrar/ocultar el botón de enviar y atrás según la sección
        const btnEnviar = document.getElementById('btnEnviar');
        const btnSiguiente = document.getElementById('btnSiguiente');
        const btnAtras = document.getElementById('btnAtras');
        if (btnEnviar && btnSiguiente && btnAtras) {
            if (idSeccion === 'documentosSubidos') {
                btnEnviar.style.display = 'inline-block';
                btnSiguiente.style.display = 'none';
                btnAtras.style.display = 'inline-block';
                btnAtras.disabled = false;
            } else if (idSeccion === 'datosAutor') {
                btnEnviar.style.display = 'none';
                btnSiguiente.style.display = 'inline-block';
                btnAtras.style.display = 'none'; // Ocultar Atrás en la primera sección
                btnAtras.disabled = true;
            } else {
                btnEnviar.style.display = 'none';
                btnSiguiente.style.display = 'inline-block';
                btnAtras.style.display = 'inline-block';
                btnAtras.disabled = false;
            }
        }
    }
    
    // Inicializar el carrusel de progreso
    function inicializarCarruselProgreso() {
        const track = document.querySelector('.progress-track');
        const slides = document.querySelectorAll('.progress-slide');
        const prevBtn = document.querySelector('.nav-arrow.prev');
        const nextBtn = document.querySelector('.nav-arrow.next');
        const slidesToShow = 4; // Número de pasos visibles a la vez
        
        if (!track || !slides.length) return;
        
        // Calcular el ancho de cada slide basado en el número de slides a mostrar
        const slideWidth = 100 / slidesToShow;
        slides.forEach(slide => {
            slide.style.minWidth = `calc(${slideWidth}% - 10px)`;
        });
        
        // Función para actualizar la visibilidad de los botones de navegación
        function updateNavButtons() {
            if (!prevBtn || !nextBtn) return;
            const maxIndex = Math.max(0, slides.length - slidesToShow);
            prevBtn.disabled = window.currentIndex <= 0;
            nextBtn.disabled = window.currentIndex >= maxIndex;
        }
        
        // Función para mover el carrusel
        function moveToSlide(index) {
            if (!track) return;
            
            // Asegurarse de que el índice esté dentro de los límites
            const maxIndex = Math.max(0, slides.length - slidesToShow);
            const newIndex = Math.max(0, Math.min(index, maxIndex));
            
            // Solo actualizar si el índice ha cambiado
            if (window.currentIndex !== newIndex) {
                window.currentIndex = newIndex;
                const offset = -window.currentIndex * (100 / slidesToShow);
                track.style.transition = 'transform 0.3s ease';
                track.style.transform = `translateX(${offset}%)`;
                updateNavButtons();
                
                // Forzar actualización del DOM
                track.offsetHeight;
            }
        }
        
        // Event listeners para los botones de navegación
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                moveToSlide(window.currentIndex - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                moveToSlide(window.currentIndex + 1);
            });
        }
        
        // Inicializar botones de navegación
        window.currentIndex = 0;
        updateNavButtons();
        
        // Hacer que los slides sean clickeables para navegar
        slides.forEach((slide, index) => {
            slide.addEventListener('click', () => {
                // Mapear el índice a los IDs de sección correctos
                const sectionIds = [
                    'datosAutor',
                    'datosContacto',
                    'datosApoderado',
                    'datosBancarios',
                    'datosTecnicos',
                    'datosGenerales',
                    'obras',
                    'derechosAdministrar',
                    'documentosFirmar',
                    'documentosSubidos'
                ];
                const seccionActual = document.querySelector('.form-section.active');
                if (!validarCamposVisiblesRequeridos(seccionActual)) {
                    // Desplazar al primer campo con error
                    const primerError = seccionActual.querySelector('.is-invalid');
                    if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
                if (sectionIds[index]) {
                    mostrarSeccion(sectionIds[index]);
                    // Actualizar la barra de progreso
                    actualizarBarraProgreso(index + 1);
                }
            });
        });
    }
    
    // Actualizar la barra de progreso
    function actualizarBarraProgreso(pasoActual) {
        const slides = document.querySelectorAll('.progress-slide');
        if (!slides.length) return;
        
        const slidesToShow = 4;
        const totalSlides = slides.length;
        const maxIndex = Math.max(0, totalSlides - slidesToShow);
        const track = document.querySelector('.progress-track');
        if (!track) return;
        
        // Actualizar clases activas
        slides.forEach((slide, index) => {
            const step = slide.querySelector('.progress-step');
            const label = slide.querySelector('.step-label');
            const isActive = (index + 1) === pasoActual;
            
            slide.classList.toggle('active', isActive);
            if (step) step.classList.toggle('active', isActive);
            if (label) label.classList.toggle('active', isActive);
            
            // Si es el paso actual, asegurarse de que sea visible
            if (isActive) {
                let targetIndex = 0;
                const currentIndex = index;
                
                // Calcular el índice objetivo según la posición del paso actual
                if (currentIndex <= 1) {
                    targetIndex = 0; // Primeros dos pasos
                } else if (currentIndex >= totalSlides - 2) {
                    targetIndex = Math.max(0, totalSlides - slidesToShow); // Últimos dos pasos
                } else {
                    targetIndex = currentIndex - 1; // Pasos intermedios
                }
                
                // Asegurar que no nos pasemos del máximo índice
                targetIndex = Math.min(targetIndex, maxIndex);
                
                // Solo actualizar si es necesario
                const isOutOfView = currentIndex < window.currentIndex || 
                                   currentIndex >= window.currentIndex + slidesToShow;
                
                if (isOutOfView || window.currentIndex > maxIndex) {
                    window.currentIndex = targetIndex;
                    const offset = -window.currentIndex * (100 / slidesToShow);
                    track.style.transition = 'transform 0.3s ease';
                    track.style.transform = `translateX(${offset}%)`;
                    track.offsetHeight; // Forzar actualización del DOM
                }
            }
        });
        
        // Actualizar estado de los botones de navegación
        const prevBtn = document.querySelector('.nav-arrow.prev');
        const nextBtn = document.querySelector('.nav-arrow.next');
        
        if (prevBtn) prevBtn.disabled = window.currentIndex <= 0;
        if (nextBtn) nextBtn.disabled = window.currentIndex >= maxIndex;
    }
    
    // Manejador de eventos para el campo de carga de archivos de identidad
    document.addEventListener('DOMContentLoaded', function() {
        const fotocopiaDocumento = document.getElementById('fotocopiaDocumento');
        const fotocopiaDocumentoFileName = document.querySelector('#fotocopiaDocumento + .file-name');
        
        if (fotocopiaDocumento) {
            // Actualizar el estado inicial
            if (fotocopiaDocumento.files.length > 0) {
                const file = fotocopiaDocumento.files[0];
                const fileName = file.name;
                const fileSize = (file.size / (1024 * 1024)).toFixed(2);
                
                documentosSubidos.identidad = {
                    nombre: fileName,
                    tamano: fileSize + ' MB',
                    tipo: 'Identificación',
                    archivo: file
                };
                
                if (fotocopiaDocumentoFileName) {
                    fotocopiaDocumentoFileName.textContent = `${fileName} (${fileSize} MB)`;
                }
            }
            
            // Configurar el manejador de cambios
            fotocopiaDocumento.addEventListener('change', function() {
                if (this.files.length > 0) {
                    const file = this.files[0];
                    const fileName = file.name;
                    const fileSize = (file.size / (1024 * 1024)).toFixed(2);
                    
                    // Actualizar el nombre del archivo
                    if (fotocopiaDocumentoFileName) {
                        fotocopiaDocumentoFileName.textContent = `${fileName} (${fileSize} MB)`;
                        fotocopiaDocumentoFileName.style.display = 'block';
            }
                    
                    // Actualizar el objeto de seguimiento
                    documentosSubidos.identidad = {
                        nombre: fileName,
                        tamano: fileSize + ' MB',
                        tipo: 'Identificación',
                        archivo: file
                    };
                    
                    console.log('Documento de identidad subido:', documentosSubidos.identidad);
                } else {
                    if (fotocopiaDocumentoFileName) {
                        fotocopiaDocumentoFileName.textContent = 'Ningún archivo seleccionado';
                        fotocopiaDocumentoFileName.style.display = 'none';
                    }
                    documentosSubidos.identidad = null;
                }
                
                // Actualizar el resumen de documentos
                actualizarResumenDocumentos();
                validarCampo(this);
        });
    }
    });
    
    // Función para actualizar el resumen de documentos
    function actualizarResumenDocumentos() {
        // Documento de Identidad
        const identidadContainer = document.getElementById('resumenDocumentoIdentidad');
        if (identidadContainer) {
            if (documentosSubidos.identidad) {
                identidadContainer.innerHTML = `
                    <div class="documento-item">
                        <div class="documento-info">
                            <i class="fas fa-check-circle"></i>
                            <div class="documento-detalle">
                                <div class="documento-nombre">${documentosSubidos.identidad.nombre}</div>
                                <div class="documento-tamano">${documentosSubidos.identidad.tamano}</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                identidadContainer.innerHTML = `
                    <div class="sin-documento">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>No se ha cargado ningún documento de identidad</span>
                    </div>
                `;
            }
        }

        // Documento de Apoderado
        const apoderadoContainer = document.getElementById('resumenDocumentosApoderado');
        if (apoderadoContainer) {
            if (documentosSubidos.apoderado) {
                apoderadoContainer.innerHTML = `
                    <div class="documento-item">
                        <div class="documento-info">
                            <i class="fas fa-check-circle"></i>
                            <div class="documento-detalle">
                                <div class="documento-nombre">${documentosSubidos.apoderado.nombre}</div>
                                <div class="documento-tamano">${documentosSubidos.apoderado.tamano}</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                apoderadoContainer.innerHTML = `
                    <div class="sin-documento">
                        <i class="fas fa-info-circle"></i>
                        <span>No aplica o no se han cargado documentos de apoderado</span>
                    </div>
                `;
            }
        }
    }
    
    // Actualizar el resumen de documentos cuando se muestre la sección
    const documentosSubidosSection = document.getElementById('documentosSubidos');
    if (documentosSubidosSection) {
        const observer = new MutationObserver(function(mutations) {
            if (documentosSubidosSection.classList.contains('active')) {
                actualizarResumenDocumentos();
            }
        });
        
        observer.observe(documentosSubidosSection, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
    
    // Manejador de eventos para el botón Siguiente
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', function(e) {
            const seccionActual = document.querySelector('.form-section.active');
            // Validación personalizada para Datos Técnicos
            if (seccionActual && seccionActual.id === 'datosTecnicos') {
                // Validar que se haya seleccionado al menos un ámbito
                const btnAmbitos = document.querySelectorAll('.btn-ambito');
                const ambitosSeleccionados = Array.from(btnAmbitos).filter(btn => btn.classList.contains('active'));
                if (ambitosSeleccionados.length === 0) {
                    e.preventDefault();
                    document.getElementById('ambitoError').textContent = 'Seleccione al menos un ámbito';
                    return;
                }
                // Validar que se haya seleccionado al menos una clase por cada ámbito
                const ambitosActivos = ambitosSeleccionados.map(btn => btn.dataset.ambito);
                let errorClase = false;
                let mensajeError = '';
                ambitosActivos.forEach(ambito => {
                    const claseMarcada = document.querySelector('.clase-option[data-ambito="' + ambito + '"] input[type="checkbox"]:checked');
                    if (!claseMarcada) {
                        errorClase = true;
                        mensajeError += `Debe seleccionar al menos una clase para el ámbito ${ambito}. `;
                    }
                });
                if (errorClase) {
                    e.preventDefault();
                    document.getElementById('claseError').textContent = mensajeError.trim();
                    return;
                }
            }
            // Validar solo los campos requeridos visibles de la sección actual
            if (!validarCamposVisiblesRequeridos(seccionActual)) {
                // Desplazar al primer campo con error
                const primerError = seccionActual.querySelector('.is-invalid');
                if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            // Avanzar a la siguiente sección (ignorando datosSucesion)
            const seccionesFiltradas = Array.from(document.querySelectorAll('.form-section')).filter(sec => sec.id !== 'datosSucesion');
            const indiceActualFiltrado = seccionesFiltradas.indexOf(seccionActual);
            if (indiceActualFiltrado < seccionesFiltradas.length - 1) {
                const siguienteSeccion = seccionesFiltradas[indiceActualFiltrado + 1];
                mostrarSeccion(siguienteSeccion.id);
                actualizarBarraProgreso(indiceActualFiltrado + 2);
                if (btnAtras) btnAtras.disabled = false;
                siguienteSeccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    
    // Manejador de eventos para el botón Atrás
    if (btnAtras) {
        btnAtras.addEventListener('click', function(e) {
            e.preventDefault();
            const seccionActual = document.querySelector('.form-section.active');
            const secciones = document.querySelectorAll('.form-section');
            const indiceActual = Array.from(secciones).indexOf(seccionActual);
            
            // Retroceder a la sección anterior (ignorando datosSucesion)
            const seccionesFiltradas = Array.from(document.querySelectorAll('.form-section')).filter(sec => sec.id !== 'datosSucesion');
            const indiceActualFiltrado = seccionesFiltradas.indexOf(seccionActual);
            if (indiceActualFiltrado > 0) {
                const seccionAnterior = seccionesFiltradas[indiceActualFiltrado - 1];
                mostrarSeccion(seccionAnterior.id);
                actualizarBarraProgreso(indiceActualFiltrado);
                if (indiceActualFiltrado === 1) {
                    btnAtras.disabled = true;
                }
                seccionAnterior.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    
    // Manejador de eventos para el botón Cancelar
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function(e) {
            e.preventDefault();
            // Mostrar modal personalizado en vez de confirm()
            const modal = document.getElementById('modalCancelar');
            if (modal) modal.style.display = 'flex';
        });
    }

    // Lógica de la ventana modal personalizada
    const modalCancelar = document.getElementById('modalCancelar');
    const modalCancelarSi = document.getElementById('modalCancelarSi');
    const modalCancelarNo = document.getElementById('modalCancelarNo');
    if (modalCancelar && modalCancelarSi && modalCancelarNo) {
        modalCancelarNo.onclick = function() {
            modalCancelar.style.display = 'none';
        };
        modalCancelarSi.onclick = function() {
            modalCancelar.style.display = 'none';
            // Mostrar overlay de loading
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.style.display = 'flex';
            // Esperar un breve momento y recargar la página
            setTimeout(() => { window.location.reload(); }, 900);
            // IMPORTANTE: No ejecutar el reseteo manual del formulario ni otras limpiezas aquí
        };
    }
    
    // Validación en tiempo real para los campos de texto
    document.querySelectorAll('input, select, textarea').forEach(campo => {
        campo.addEventListener('blur', function() {
            validarCampo(this);
        });
            campo.addEventListener('input', function() {
                validarCampo(this);
            });
    });

    // Validación de RUN para apoderado y sucesión
    const apoderadoRunInput = document.getElementById('apoderadoRun');
    if (apoderadoRunInput) {
        apoderadoRunInput.addEventListener('input', function() {
            formatearRUN(apoderadoRunInput);
        });
        apoderadoRunInput.addEventListener('blur', function() {
            const valor = apoderadoRunInput.value.trim();
            const errorElement = apoderadoRunInput.closest('.form-group')?.querySelector('.error-message');
            if (valor && !validarRUN(valor)) {
                apoderadoRunInput.classList.add('is-invalid');
                if (errorElement) errorElement.textContent = 'RUN chileno inválido';
            } else {
                apoderadoRunInput.classList.remove('is-invalid');
                if (errorElement) errorElement.textContent = '';
            }
        });
    }
    const sucesionRunInput = document.getElementById('sucesionRun');
    if (sucesionRunInput) {
        sucesionRunInput.addEventListener('input', function() {
            formatearRUN(sucesionRunInput);
        });
        sucesionRunInput.addEventListener('blur', function() {
            const valor = sucesionRunInput.value.trim();
            const errorElement = sucesionRunInput.closest('.form-group')?.querySelector('.error-message');
            if (valor && !validarRUN(valor)) {
                sucesionRunInput.classList.add('is-invalid');
                if (errorElement) errorElement.textContent = 'RUN chileno inválido';
            } else {
                sucesionRunInput.classList.remove('is-invalid');
                if (errorElement) errorElement.textContent = '';
            }
        });
    }
    
    // Inicializar la barra de progreso
    actualizarBarraProgreso(1);
    
    // Inicializar el selector de códigos de país
    inicializarSelectorCodigoPais();
    
    // Inicializar la lógica de la sección de Datos Técnicos
    inicializarDatosTecnicos();
    
    // Inicializar la funcionalidad de obras dinámicas
    inicializarObrasDinamicas();
    
    inicializarManejadorDeArchivos();
    actualizarResumenDocumentos(); // Para inicializar el resumen al cargar la página
    // inicializarGruposDinamicos(); // Esta línea debe ser eliminada

    // Formateo automático de RUN en datos de autor
    const runInput = document.getElementById('run');
    if (runInput) {
        runInput.addEventListener('input', function() {
            formatearRUN(runInput);
        });
    }

    // Inicializar Select2 para nacionalidad con búsqueda inmediata
    const selectNacionalidad = document.getElementById('nacionalidad');
    if (selectNacionalidad) {
        $(selectNacionalidad).select2({
            placeholder: 'Seleccione una opción',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body'),
            minimumResultsForSearch: 0 // Siempre muestra la caja de búsqueda
        });
        // Permitir enfocar y escribir directamente
        selectNacionalidad.addEventListener('focus', function() {
            $(this).select2('open');
        });
    }

    // Restringir fechas máximas en fecha de nacimiento y defunción
    const fechaNacimientoInput = document.getElementById('fechaNacimiento');
    const fechaDefuncionInput = document.getElementById('fechaDefuncion');
    if (fechaNacimientoInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaNacimientoInput.max = hoy;
    }
    if (fechaDefuncionInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaDefuncionInput.max = hoy;
    }

    // Mostrar/ocultar campo Estado según país de residencia
    const estadoContainer = document.getElementById('estadoContainer');
    const distritoContainer = document.getElementById('distritoContainer');
    if (paisResidencia && estadoContainer && regionContainer && comunaContainer && distritoContainer) {
        paisResidencia.addEventListener('change', function() {
            const pais = this.value ? this.value.toLowerCase() : '';
            // Limpiar campos Estado, Distrito, Región y Comuna al cambiar país
            const estadoInput = document.getElementById('estado');
            const distritoInput = document.getElementById('distrito');
            const regionSelect = document.getElementById('region');
            const comunaSelect = document.getElementById('comuna');
            if (estadoInput) {
                estadoInput.value = '';
                estadoInput.classList.remove('is-invalid');
                const error = estadoInput.closest('.form-group')?.querySelector('.error-message');
                if (error) error.textContent = '';
            }
            if (distritoInput) {
                distritoInput.value = '';
                distritoInput.classList.remove('is-invalid');
                const error = distritoInput.closest('.form-group')?.querySelector('.error-message');
                if (error) error.textContent = '';
            }
            if (regionSelect) {
                regionSelect.value = '';
                $(regionSelect).trigger('change');
                regionSelect.classList.remove('is-invalid');
                const error = regionSelect.closest('.form-group')?.querySelector('.error-message');
                if (error) error.textContent = '';
            }
            if (comunaSelect) {
                comunaSelect.value = '';
                $(comunaSelect).trigger('change');
                comunaSelect.classList.remove('is-invalid');
                const error = comunaSelect.closest('.form-group')?.querySelector('.error-message');
                if (error) error.textContent = '';
            }
            if (pais === 'chile' || pais.includes('chile')) {
                // Mostrar región y comuna, ocultar estado y distrito
                estadoContainer.style.display = 'none';
                distritoContainer.style.display = 'none';
                regionContainer.style.display = '';
                comunaContainer.style.display = '';
            } else if (pais) {
                // Mostrar estado y distrito, ocultar región y comuna
                estadoContainer.style.display = '';
                distritoContainer.style.display = '';
                regionContainer.style.display = 'none';
                comunaContainer.style.display = 'none';
            } else {
                // Si no hay país seleccionado, ocultar estado y distrito, mostrar región y comuna
                estadoContainer.style.display = 'none';
                distritoContainer.style.display = 'none';
                regionContainer.style.display = '';
            }
        });
    }

    // Corregir validación visual del campo Género
    const generoSelect = document.getElementById('genero');
    if (generoSelect) {
        generoSelect.addEventListener('change', function() {
            if (this.value) {
                this.classList.remove('is-invalid');
                const errorElement = this.closest('.form-group')?.querySelector('.error-message');
                if (errorElement) errorElement.textContent = '';
            }
        });
    }

    // Corregir validación visual del campo Región/Estado
    const regionSelect = document.getElementById('region');
    if (regionSelect) {
        regionSelect.addEventListener('change', function() {
            if (this.value) {
                this.classList.remove('is-invalid');
                const errorElement = this.closest('.form-group')?.querySelector('.error-message');
                if (errorElement) errorElement.textContent = '';
            }
        });
    }

    // Cargar países en el campo de prueba backup
    try {
        const response = await fetch('assets/paises.json');
        if (response.ok) {
            const paises = await response.json();
            const selectBackup = document.getElementById('paisResidenciaBackup');
            if (selectBackup) {
                // Limpiar opciones excepto la primera
                while (selectBackup.options.length > 1) {
                    selectBackup.remove(1);
                }
                paises.forEach(pais => {
                    const option = document.createElement('option');
                    option.value = pais.País;
                    option.textContent = pais.País;
                    selectBackup.appendChild(option);
                });
                // Inicializar Select2
                $(selectBackup).select2({
                    placeholder: 'Seleccione un país',
                    allowClear: true,
                    width: '100%',
                    dropdownParent: $('body'),
                    minimumResultsForSearch: 0
                });
            }
        } else {
            console.error('No se pudo cargar paises.json para el backup');
        }
    } catch (e) {
        console.error('Error cargando paises.json para backup:', e);
    }

    // Cargar regiones en el campo backup
    let regionesComunasBackup = [];
    try {
        const response = await fetch('assets/regionesycomunas.json');
        if (response.ok) {
            regionesComunasBackup = await response.json();
            const selectRegionBackup = document.getElementById('regionBackup');
            if (selectRegionBackup) {
                // Limpiar opciones excepto la primera
                while (selectRegionBackup.options.length > 1) {
                    selectRegionBackup.remove(1);
                }
                // Obtener regiones únicas
                const regionesUnicas = [...new Set(regionesComunasBackup.map(item => item['Región']))];
                regionesUnicas.forEach(region => {
                    const option = document.createElement('option');
                    option.value = region;
                    option.textContent = region;
                    selectRegionBackup.appendChild(option);
                });
                // Inicializar Select2
                $(selectRegionBackup).select2({
                    placeholder: 'Seleccione una región/estado',
                    allowClear: true,
                    width: '100%',
                    dropdownParent: $('body'),
                    minimumResultsForSearch: 0
                });
            }
        }
    } catch (e) {
        console.error('Error cargando regionesycomunas.json para backup:', e);
    }

    // Inicializar Select2 para comuna backup
    const selectComunaBackup = document.getElementById('comunaBackup');
    if (selectComunaBackup) {
        $(selectComunaBackup).select2({
            placeholder: 'Seleccione una comuna',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body'),
            minimumResultsForSearch: 0
        });
    }

    // Actualizar comunas backup al cambiar región backup
    const selectRegionBackup = document.getElementById('regionBackup');
    if (selectRegionBackup && selectComunaBackup) {
        $(selectRegionBackup).on('change', function() {
            const regionSeleccionada = this.value;
            // Limpiar opciones excepto la primera
            while (selectComunaBackup.options.length > 1) {
                selectComunaBackup.remove(1);
            }
            if (regionSeleccionada && regionesComunasBackup.length > 0) {
                const comunas = regionesComunasBackup.filter(item => item['Región'] === regionSeleccionada).map(item => item['Comuna']);
                comunas.forEach(comuna => {
                    const option = document.createElement('option');
                    option.value = comuna;
                    option.textContent = comuna;
                    selectComunaBackup.appendChild(option);
                });
            }
            // Refrescar Select2
            $(selectComunaBackup).val('').trigger('change.select2');
        });
    }

    // Habilitar región y comuna backup solo si el país backup es Chile
    const selectPaisBackup = document.getElementById('paisResidenciaBackup');
    if (selectPaisBackup && selectRegionBackup && selectComunaBackup) {
        const regionBackupGroup = document.getElementById('regionBackup').closest('.form-group');
        const comunaBackupGroup = document.getElementById('comunaBackup').closest('.form-group');
        const estadoBackupGroup = document.getElementById('estadoBackup').closest('.form-group');
        const distritoBackupGroup = document.getElementById('distritoBackup').closest('.form-group');
        $(selectPaisBackup).on('change', function() {
            const pais = this.value ? this.value.trim().toLowerCase() : '';
            if (pais === 'chile') {
                selectRegionBackup.disabled = false;
                $(selectRegionBackup).prop('disabled', false).trigger('change.select2');
                selectComunaBackup.disabled = false;
                $(selectComunaBackup).prop('disabled', false).trigger('change.select2');
                if(regionBackupGroup) regionBackupGroup.style.display = '';
                if(comunaBackupGroup) comunaBackupGroup.style.display = '';
                if(estadoBackupGroup) {
                    estadoBackupGroup.style.display = 'none';
                    document.getElementById('estadoBackup').disabled = true;
                    document.getElementById('estadoBackup').value = '';
                }
                if(distritoBackupGroup) {
                    distritoBackupGroup.style.display = 'none';
                    document.getElementById('distritoBackup').disabled = true;
                    document.getElementById('distritoBackup').value = '';
                }
            } else {
                selectRegionBackup.disabled = true;
                $(selectRegionBackup).prop('disabled', true).val('').trigger('change.select2');
                selectComunaBackup.disabled = true;
                $(selectComunaBackup).prop('disabled', true).val('').trigger('change.select2');
                if(regionBackupGroup) regionBackupGroup.style.display = 'none';
                if(comunaBackupGroup) comunaBackupGroup.style.display = 'none';
                if(estadoBackupGroup) {
                    estadoBackupGroup.style.display = '';
                    document.getElementById('estadoBackup').disabled = false;
                }
                if(distritoBackupGroup) {
                    distritoBackupGroup.style.display = '';
                    document.getElementById('distritoBackup').disabled = false;
                }
            }
        });
    }

    // Función para cargar los bancos desde banco.json y poblar el select
    async function cargarBancos() {
        try {
            const response = await fetch('assets/banco.json');
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de bancos');
            }
            const bancos = await response.json();
            const selectBanco = document.getElementById('banco');
            if (!selectBanco) return;
            // Limpiar opciones excepto la primera
            while (selectBanco.options.length > 1) {
                selectBanco.remove(1);
            }
            bancos.forEach(banco => {
                const option = document.createElement('option');
                option.value = banco.Banco;
                option.textContent = banco.Banco;
                selectBanco.appendChild(option);
            });
            // Inicializar/actualizar Select2
            $(selectBanco).select2({
                placeholder: 'Seleccione un banco',
                allowClear: true,
                width: '100%',
                dropdownParent: $('body'),
                minimumResultsForSearch: 0
            });
            $(selectBanco).trigger('change.select2');
        } catch (error) {
            console.error('Error al cargar los bancos:', error);
        }
    }

    // Llamar a cargarBancos aquí para asegurar que el DOM esté listo
    cargarBancos();

    // Función para cargar los tipos de cuenta desde tipodecuenta.json y poblar el select
    async function cargarTiposDeCuenta() {
        try {
            const response = await fetch('assets/tipodecuenta.json');
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de tipos de cuenta');
            }
            const tipos = await response.json();
            const selectTipoCuenta = document.getElementById('tipoCuenta');
            if (!selectTipoCuenta) return;
            // Limpiar opciones excepto la primera
            while (selectTipoCuenta.options.length > 1) {
                selectTipoCuenta.remove(1);
            }
            tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo["Tipo de cuenta"];
                option.textContent = tipo["Tipo de cuenta"];
                selectTipoCuenta.appendChild(option);
            });
            // Inicializar/actualizar Select2
            $(selectTipoCuenta).select2({
                placeholder: 'Seleccione tipo de cuenta',
                allowClear: true,
                width: '100%',
                dropdownParent: $('body'),
                minimumResultsForSearch: 0
            });
            $(selectTipoCuenta).trigger('change.select2');
        } catch (error) {
            console.error('Error al cargar los tipos de cuenta:', error);
        }
    }

    // Llamar a cargarTiposDeCuenta aquí para asegurar que el DOM esté listo
    cargarTiposDeCuenta();

    // Función para cargar los tipos de banco desde tipodebanco.json y poblar el select
    async function cargarTiposDeBanco() {
        try {
            const response = await fetch('assets/tipodebanco.json');
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de tipos de banco');
            }
            const tipos = await response.json();
            const selectTipoBanco = document.getElementById('tipoBanco');
            if (!selectTipoBanco) return;
            // Limpiar opciones excepto la primera
            while (selectTipoBanco.options.length > 1) {
                selectTipoBanco.remove(1);
            }
            tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo["Tipo de banco"];
                option.textContent = tipo["Tipo de banco"];
                selectTipoBanco.appendChild(option);
            });
            // Inicializar/actualizar Select2
            $(selectTipoBanco).select2({
                placeholder: 'Seleccione tipo de banco',
                allowClear: true,
                width: '100%',
                dropdownParent: $('body'),
                minimumResultsForSearch: 0
            });
            $(selectTipoBanco).trigger('change.select2');
        } catch (error) {
            console.error('Error al cargar los tipos de banco:', error);
        }
    }

    // Llamar a cargarTiposDeBanco aquí para asegurar que el DOM esté listo
    cargarTiposDeBanco();

    // Lógica para mostrar/ocultar campos según Tipo de Banco
    const tipoBancoSelect = document.getElementById('tipoBanco');
    const bancoSelectGroup = document.getElementById('banco')?.closest('.form-group');
    const tipoCuentaGroup = document.getElementById('tipoCuenta')?.closest('.form-group');
    const numeroCuentaGroup = document.getElementById('numeroCuenta')?.closest('.form-group');
    const bancoLibreGroup = document.getElementById('bancoLibre')?.closest('.form-group');

    function actualizarCamposBanco() {
        const tipoBanco = tipoBancoSelect ? tipoBancoSelect.value : '';
        if (tipoBanco === 'Nacional') {
            // Mostrar campos nacionales, ocultar extranjeros
            if (bancoSelectGroup) bancoSelectGroup.style.display = '';
            if (tipoCuentaGroup) tipoCuentaGroup.style.display = '';
            if (numeroCuentaGroup) numeroCuentaGroup.style.display = '';
            if (bancoLibreGroup) bancoLibreGroup.style.display = 'none';
            if (paisBancoGroup) paisBancoGroup.style.display = 'none';
            if (direccionBancoExtranjeroGroup) direccionBancoExtranjeroGroup.style.display = 'none';
            if (numeroCuentaExtranjeroGroup) numeroCuentaExtranjeroGroup.style.display = 'none';
            if (swiftIbanGroup) swiftIbanGroup.style.display = 'none';
            // Requeridos nacionales
            $('#banco').prop('required', true);
            $('#tipoCuenta, #numeroCuenta').prop('required', true);
            // No requeridos extranjeros
            $('#bancoLibre, #paisBanco, #direccionBancoExtranjero, #numeroCuentaExtranjero, #swiftIban').prop('required', false);
            // Limpiar campos de banco extranjero
            $('#bancoLibre').val('').trigger('change');
            $('#paisBanco').val('').trigger('change');
            $('#direccionBancoExtranjero').val('');
            $('#numeroCuentaExtranjero').val('');
            $('#swiftIban').val('');
        } else if (tipoBanco === 'Extranjero') {
            // Mostrar campos extranjeros, ocultar nacionales
            if (bancoSelectGroup) bancoSelectGroup.style.display = 'none';
            if (tipoCuentaGroup) tipoCuentaGroup.style.display = 'none';
            if (numeroCuentaGroup) numeroCuentaGroup.style.display = 'none';
            if (bancoLibreGroup) bancoLibreGroup.style.display = '';
            if (paisBancoGroup) paisBancoGroup.style.display = '';
            if (direccionBancoExtranjeroGroup) direccionBancoExtranjeroGroup.style.display = '';
            if (numeroCuentaExtranjeroGroup) numeroCuentaExtranjeroGroup.style.display = '';
            if (swiftIbanGroup) swiftIbanGroup.style.display = '';
            // No requeridos nacionales
            $('#banco, #tipoCuenta, #numeroCuenta').prop('required', false);
            // Requeridos extranjeros (excepto dirección que es opcional)
            $('#bancoLibre, #paisBanco, #numeroCuentaExtranjero, #swiftIban').prop('required', true);
            $('#direccionBancoExtranjero').prop('required', false);
            // Limpiar campos de banco nacional
            $('#banco').val('').trigger('change');
            $('#tipoCuenta').val('').trigger('change');
            $('#numeroCuenta').val('');
        } else {
            // Ocultar todos
            if (bancoSelectGroup) bancoSelectGroup.style.display = 'none';
            if (tipoCuentaGroup) tipoCuentaGroup.style.display = 'none';
            if (numeroCuentaGroup) numeroCuentaGroup.style.display = 'none';
            if (bancoLibreGroup) bancoLibreGroup.style.display = 'none';
            if (paisBancoGroup) paisBancoGroup.style.display = 'none';
            if (direccionBancoExtranjeroGroup) direccionBancoExtranjeroGroup.style.display = 'none';
            if (numeroCuentaExtranjeroGroup) numeroCuentaExtranjeroGroup.style.display = 'none';
            if (swiftIbanGroup) swiftIbanGroup.style.display = 'none';
            // Ninguno requerido
            $('#banco, #tipoCuenta, #numeroCuenta, #bancoLibre, #paisBanco, #direccionBancoExtranjero, #numeroCuentaExtranjero, #swiftIban').prop('required', false);
            // Limpiar todos los campos bancarios
            $('#banco, #tipoCuenta, #paisBanco').val('').trigger('change');
            $('#numeroCuenta, #bancoLibre, #direccionBancoExtranjero, #numeroCuentaExtranjero, #swiftIban').val('');
        }
    }
    if (tipoBancoSelect) {
        tipoBancoSelect.addEventListener('change', actualizarCamposBanco);
        // Ejecutar al cargar
        actualizarCamposBanco();
    }

    // Lógica para mostrar/ocultar campos según Tipo de Banco (más robusta)
    function getBancoGroups() {
        return {
            bancoSelectGroup: document.querySelector('#banco')?.closest('.form-group'),
            tipoCuentaGroup: document.querySelector('#tipoCuenta')?.closest('.form-group'),
            numeroCuentaGroup: document.querySelector('#numeroCuenta')?.closest('.form-group'),
            bancoLibreGroup: document.querySelector('#bancoLibre')?.closest('.form-group'),
            paisBancoGroup: document.getElementById('paisBancoGroup'),
            direccionBancoExtranjeroGroup: document.getElementById('direccionBancoExtranjeroGroup'),
            numeroCuentaExtranjeroGroup: document.getElementById('numeroCuentaExtranjeroGroup'),
            swiftIbanGroup: document.getElementById('swiftIbanGroup'),
        };
    }
    function actualizarCamposBanco() {
        const tipoBanco = $('#tipoBanco').val();
        const {
            bancoSelectGroup,
            tipoCuentaGroup,
            numeroCuentaGroup,
            bancoLibreGroup,
            paisBancoGroup,
            direccionBancoExtranjeroGroup,
            numeroCuentaExtranjeroGroup,
            swiftIbanGroup
        } = getBancoGroups();
        if (tipoBanco === 'Nacional') {
            // Mostrar campos nacionales, ocultar extranjeros
            if (bancoSelectGroup) bancoSelectGroup.style.display = '';
            if (tipoCuentaGroup) tipoCuentaGroup.style.display = '';
            if (numeroCuentaGroup) numeroCuentaGroup.style.display = '';
            if (bancoLibreGroup) bancoLibreGroup.style.display = 'none';
            if (paisBancoGroup) paisBancoGroup.style.display = 'none';
            if (direccionBancoExtranjeroGroup) direccionBancoExtranjeroGroup.style.display = 'none';
            if (numeroCuentaExtranjeroGroup) numeroCuentaExtranjeroGroup.style.display = 'none';
            if (swiftIbanGroup) swiftIbanGroup.style.display = 'none';
            // Requeridos nacionales
            $('#banco').prop('required', true);
            $('#tipoCuenta, #numeroCuenta').prop('required', true);
            // No requeridos extranjeros
            $('#bancoLibre, #paisBanco, #direccionBancoExtranjero, #numeroCuentaExtranjero, #swiftIban').prop('required', false);
            // Limpiar campos de banco extranjero
            $('#bancoLibre').val('').trigger('change');
            $('#paisBanco').val('').trigger('change');
            $('#direccionBancoExtranjero').val('');
            $('#numeroCuentaExtranjero').val('');
            $('#swiftIban').val('');
        } else if (tipoBanco === 'Extranjero') {
            // Mostrar campos extranjeros, ocultar nacionales
            if (bancoSelectGroup) bancoSelectGroup.style.display = 'none';
            if (tipoCuentaGroup) tipoCuentaGroup.style.display = 'none';
            if (numeroCuentaGroup) numeroCuentaGroup.style.display = 'none';
            if (bancoLibreGroup) bancoLibreGroup.style.display = '';
            if (paisBancoGroup) paisBancoGroup.style.display = '';
            if (direccionBancoExtranjeroGroup) direccionBancoExtranjeroGroup.style.display = '';
            if (numeroCuentaExtranjeroGroup) numeroCuentaExtranjeroGroup.style.display = '';
            if (swiftIbanGroup) swiftIbanGroup.style.display = '';
            // No requeridos nacionales
            $('#banco, #tipoCuenta, #numeroCuenta').prop('required', false);
            // Requeridos extranjeros (excepto dirección que es opcional)
            $('#bancoLibre, #paisBanco, #numeroCuentaExtranjero, #swiftIban').prop('required', true);
            $('#direccionBancoExtranjero').prop('required', false);
            // Limpiar campos de banco nacional
            $('#banco').val('').trigger('change');
            $('#tipoCuenta').val('').trigger('change');
            $('#numeroCuenta').val('');
        } else {
            // Ocultar todos
            if (bancoSelectGroup) bancoSelectGroup.style.display = 'none';
            if (tipoCuentaGroup) tipoCuentaGroup.style.display = 'none';
            if (numeroCuentaGroup) numeroCuentaGroup.style.display = 'none';
            if (bancoLibreGroup) bancoLibreGroup.style.display = 'none';
            if (paisBancoGroup) paisBancoGroup.style.display = 'none';
            if (direccionBancoExtranjeroGroup) direccionBancoExtranjeroGroup.style.display = 'none';
            if (numeroCuentaExtranjeroGroup) numeroCuentaExtranjeroGroup.style.display = 'none';
            if (swiftIbanGroup) swiftIbanGroup.style.display = 'none';
            // Ninguno requerido
            $('#banco, #tipoCuenta, #numeroCuenta, #bancoLibre, #paisBanco, #direccionBancoExtranjero, #numeroCuentaExtranjero, #swiftIban').prop('required', false);
            // Limpiar todos los campos bancarios
            $('#banco, #tipoCuenta, #paisBanco').val('').trigger('change');
            $('#numeroCuenta, #bancoLibre, #direccionBancoExtranjero, #numeroCuentaExtranjero, #swiftIban').val('');
        }
    }
    $('#tipoBanco').on('change', actualizarCamposBanco);
    // Ejecutar al cargar (después de inicializar select2)
    setTimeout(actualizarCamposBanco, 0);

    // Ocultar todos los campos bancarios menos tipoBanco al cargar la página
    [
        document.querySelector('#banco')?.closest('.form-group'),
        document.querySelector('#tipoCuenta')?.closest('.form-group'),
        document.querySelector('#numeroCuenta')?.closest('.form-group'),
        document.querySelector('#bancoLibre')?.closest('.form-group'),
        document.querySelector('#paisBancoGroup')?.closest('.form-group'),
        document.querySelector('#direccionBancoExtranjeroGroup')?.closest('.form-group'),
        document.querySelector('#numeroCuentaExtranjeroGroup')?.closest('.form-group'),
        document.querySelector('#swiftIbanGroup')?.closest('.form-group')
    ].forEach(group => { if (group) group.style.display = 'none'; });

    // Función para cargar los países en el select2 de paísBanco (extranjero)
    async function cargarPaisesBanco() {
        try {
            const response = await fetch('assets/paises.json');
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de países');
            }
            const paises = await response.json();
            const selectPaisBanco = document.getElementById('paisBanco');
            if (!selectPaisBanco) return;
            // Limpiar opciones excepto la primera
            while (selectPaisBanco.options.length > 1) {
                selectPaisBanco.remove(1);
            }
            paises.forEach(pais => {
                const option = document.createElement('option');
                option.value = pais["País"];
                option.textContent = pais["País"];
                selectPaisBanco.appendChild(option);
            });
            // Inicializar/actualizar Select2
            $(selectPaisBanco).select2({
                placeholder: 'Seleccione un país',
                allowClear: true,
                width: '100%',
                dropdownParent: $('body'),
                minimumResultsForSearch: 0
            });
            $(selectPaisBanco).trigger('change.select2');
        } catch (error) {
            console.error('Error al cargar los países para el banco extranjero:', error);
        }
    }
    cargarPaisesBanco();

    // Añadir placeholder al buscador de todos los select2
    $(document).on('select2:open', function(e) {
        // Si hay más de un select2 abierto, se aplica a todos
        document.querySelectorAll('input.select2-search__field').forEach(function(input) {
            input.placeholder = 'Buscar...';
        });
    });

    // --- MODAL REPRESENTANTE LEGAL ---
    let representanteLegalDecision = null;
    let modalMostradoRepresentanteLegal = false;

    function setRepresentanteLegalEditable(editable) {
        const section = document.getElementById('datosApoderado');
        if (!section) return;
        const inputs = section.querySelectorAll('input, select, textarea, button');
        inputs.forEach(el => {
            if (editable) {
                el.removeAttribute('disabled');
                // Quitar candado si existe
                if (el.parentElement && el.parentElement.querySelector('.lock-icon')) {
                    el.parentElement.querySelector('.lock-icon').remove();
                }
            } else {
                if (el.type !== 'hidden') el.setAttribute('disabled', 'disabled');
                // Agregar candado solo a input, select, textarea (no a button)
                if ((el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') && el.parentElement && !el.parentElement.querySelector('.lock-icon')) {
                    const span = document.createElement('span');
                    span.className = 'lock-icon';
                    span.innerHTML = '<i class="fas fa-lock"></i>';
                    el.parentElement.appendChild(span);
                }
            }
        });
        // --- NUEVO: Manejar campos requeridos ---
        // Lista de campos obligatorios
        const obligatorios = [
            'apoderadoNombres',
            'apoderadoApellidoPaterno',
            'apoderadoRun',
            'apoderadoEmail',
            'apoderadoCodigoPais',
            'apoderadoTelefono',
            'apoderadoDocumento' // Ahora también obligatorio
        ];
        obligatorios.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                if (editable) {
                    campo.setAttribute('required', 'required');
                } else {
                    campo.removeAttribute('required');
                }
            }
        });
        // Los campos NO obligatorios: apoderadoApellidoMaterno y fechaDefuncion
        const noObligatorios = [
            'apoderadoApellidoMaterno',
            'fechaDefuncion'
        ];
        noObligatorios.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.removeAttribute('required');
        });
    }

    function mostrarModalRepresentanteLegal(callback) {
        const modal = document.getElementById('modalRepresentanteLegal');
        const confirmar = document.getElementById('modalRepresentanteLegalConfirmar');
        const radios = modal.querySelectorAll('input[name="opcionRepresentanteLegal"]');
        confirmar.disabled = true;
        radios.forEach(r => r.checked = false);
        modal.style.display = 'flex';
        let seleccion = null;
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                seleccion = this.value;
                confirmar.disabled = false;
            });
        });
        confirmar.onclick = function() {
            modal.style.display = 'none';
            representanteLegalDecision = seleccion;
            setRepresentanteLegalEditable(seleccion === 'si');
            if (callback) callback(seleccion);
            if (seleccion === 'no') {
                // Avanzar automáticamente a la siguiente sección
                mostrarSeccion('datosBancarios');
                actualizarBarraProgreso(4);
            }
            // Si es 'si', no avanzar, solo cerrar el modal
        };
    }

    // Interceptar avance por botón Siguiente
    const btnSiguienteRL = document.getElementById('btnSiguiente');
    if (btnSiguienteRL) {
        btnSiguienteRL.addEventListener('click', function(e) {
            const seccionActual = document.querySelector('.form-section.active');
            if (seccionActual && seccionActual.id === 'datosContacto') {
                if (!representanteLegalDecision && !modalMostradoRepresentanteLegal) {
                    e.preventDefault();
                    modalMostradoRepresentanteLegal = true;
                    mostrarModalRepresentanteLegal(() => {
                        // Avanzar a la sección de apoderado
                        mostrarSeccion('datosApoderado');
                        actualizarBarraProgreso(3);
                    });
                    return;
                }
            }
        }, true);
    }

    // Interceptar avance por cinta de navegación
    function interceptarCintaRepresentanteLegal() {
        const slides = document.querySelectorAll('.progress-slide');
        slides.forEach((slide, index) => {
            slide.addEventListener('click', function(e) {
                // El índice 2 corresponde a datosApoderado
                if (index === 2) {
                    const seccionActual = document.querySelector('.form-section.active');
                    if (seccionActual && seccionActual.id === 'datosContacto') {
                        if (!representanteLegalDecision && !modalMostradoRepresentanteLegal) {
                            e.preventDefault();
                            modalMostradoRepresentanteLegal = true;
                            mostrarModalRepresentanteLegal(() => {
                                mostrarSeccion('datosApoderado');
                                actualizarBarraProgreso(3);
                            });
                            return;
                        }
                    }
                }
            }, true);
        });
    }
    document.addEventListener('DOMContentLoaded', interceptarCintaRepresentanteLegal);

    // Al cargar, la decisión se reinicia
    representanteLegalDecision = null;
    modalMostradoRepresentanteLegal = false;

    // --- Firma electrónica del postulante ---
    const firmaInput = document.getElementById('firmaPostulante');
    const firmaInfo = document.getElementById('infoFirmaPostulante');
    const firmaError = document.getElementById('errorFirmaPostulante');
    const firmaPreview = document.getElementById('firmaPreview');
    const firmaImgPreview = document.getElementById('firmaImgPreview');
    const firmaDeleteBtn = firmaInfo ? firmaInfo.querySelector('.btn-eliminar-doc') : null;

    if (firmaInput) {
        // Limpiar listeners previos
        const newFirmaInput = firmaInput.cloneNode(true);
        firmaInput.parentNode.replaceChild(newFirmaInput, firmaInput);

        newFirmaInput.addEventListener('change', function(e) {
            if (!this.files || !this.files[0]) return;
            const file = this.files[0];
            const fileName = file.name;
            const fileSize = (file.size / (1024 * 1024)).toFixed(2); // MB
            const fileType = file.type;
            // Validar tipo SOLO para imagen
            if (!(fileType === 'image/jpeg' || fileType === 'image/png')) {
                if (firmaError) firmaError.textContent = 'Solo se aceptan imágenes JPG o PNG.';
                this.value = '';
                if (firmaPreview) firmaPreview.style.display = 'none';
                return;
            }
            // Validar tamaño
            if (file.size > 2 * 1024 * 1024) {
                if (firmaError) firmaError.textContent = 'La imagen es demasiado grande. Máximo permitido: 2MB.';
                this.value = '';
                if (firmaPreview) firmaPreview.style.display = 'none';
                return;
            }
            // Limpiar error
            if (firmaError) firmaError.textContent = '';
            // Mostrar nombre
            if (firmaInfo) {
                const nombreElem = firmaInfo.querySelector('.documento-nombre');
                if (nombreElem) nombreElem.textContent = `${fileName} (${fileSize} MB)`;
                if (firmaDeleteBtn) firmaDeleteBtn.style.display = 'inline-flex';
            }
            // Previsualizar imagen
            const reader = new FileReader();
            reader.onload = function(ev) {
                if (firmaImgPreview) firmaImgPreview.src = ev.target.result;
                if (firmaPreview) firmaPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
        // Botón de eliminar
        if (firmaDeleteBtn) {
            firmaDeleteBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                newFirmaInput.value = '';
                if (firmaInfo) {
                    const nombreElem = firmaInfo.querySelector('.documento-nombre');
                    if (nombreElem) nombreElem.textContent = 'Ningún archivo seleccionado';
                    firmaDeleteBtn.style.display = 'none';
                }
                if (firmaPreview) firmaPreview.style.display = 'none';
                if (firmaError) firmaError.textContent = '';
            });
        }
    }
    // --- Fin firma electrónica ---
});

function inicializarManejadorDeArchivos() {
    const fileInputs = [
        { id: 'fotocopiaDocumento', tipo: 'identidad' },
        { id: 'apoderadoDocumento', tipo: 'apoderado' },
        { id: 'sucesionDocumento', tipo: 'sucesion' }
    ];

    fileInputs.forEach(({ id, tipo }) => {
        const input = document.getElementById(id);
        if (!input) return;

        const formGroup = input.closest('.form-group.file-upload');
        if (!formGroup) return;
        
        const fileInfo = formGroup.querySelector('.file-info');
        const fileNameSpan = formGroup.querySelector('.file-name');
        const defaultIcon = fileInfo.querySelector('i.fa-upload');
        const errorElement = formGroup.querySelector('.error-message');
        const defaultText = fileNameSpan ? fileNameSpan.textContent : 'Seleccionar archivo';

        const resetUI = () => {
            if (fileNameSpan) fileNameSpan.textContent = defaultText;
            if (errorElement) errorElement.textContent = '';
            // Eliminar todos los elementos de previsualización, íconos y botón de eliminar
            fileInfo.querySelectorAll('.file-preview, .file-icon, .btn-remove-file-preview').forEach(el => el.remove());
            if (defaultIcon && !fileInfo.contains(defaultIcon)) {
                fileInfo.prepend(defaultIcon);
            }
        };

        input.addEventListener('change', function(event) {
            resetUI();
            const file = event.target.files[0];

            if (!file) {
                documentosSubidos[tipo] = null;
                actualizarResumenDocumentos();
                return;
            }
            
            // --- Validación ---
            const validImageTypes = ['image/jpeg', 'image/png'];
            const validFileTypes = ['application/pdf'];
            const allValidTypes = [...validImageTypes, ...validFileTypes];

            if (!allValidTypes.includes(file.type)) {
                errorElement.textContent = 'Solo se admiten archivos PDF, JPG o PNG.';
                input.value = '';
                documentosSubidos[tipo] = null;
                actualizarResumenDocumentos();
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5 MB
                errorElement.textContent = 'El archivo no debe superar los 5MB.';
                input.value = '';
                documentosSubidos[tipo] = null;
                actualizarResumenDocumentos();
                return;
            }

            // --- Actualizar UI y Objeto de Datos ---
            errorElement.textContent = '';
            const fileInfoForObject = {
                nombre: file.name,
                tamano: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                tipo: `Documento de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
                archivo: file,
                fechaSubida: new Date().toLocaleString()
            };

            documentosSubidos[tipo] = fileInfoForObject;

            if (fileNameSpan) fileNameSpan.textContent = `${file.name} (${fileInfoForObject.tamano})`;
            
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn-remove-file-preview';
            removeBtn.title = 'Eliminar archivo';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.style.position = 'relative';
            removeBtn.style.zIndex = '2';

            if (defaultIcon) defaultIcon.remove();

            if (validImageTypes.includes(file.type)) {
                const previewImg = document.createElement('img');
                previewImg.className = 'file-preview';
                previewImg.src = URL.createObjectURL(file);
                fileInfo.prepend(previewImg);
            } else {
                const pdfIcon = document.createElement('i');
                pdfIcon.className = 'fas fa-file-pdf file-icon';
                fileInfo.prepend(pdfIcon);
            }
            
            fileInfo.appendChild(removeBtn);

            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                input.value = '';
                documentosSubidos[tipo] = null;
                resetUI();
                actualizarResumenDocumentos();
            });

            actualizarResumenDocumentos();
        });
    });
}

// Función para inicializar la lógica de la sección de Datos Técnicos
function inicializarDatosTecnicos() {
    // Referencias a los elementos del formulario
    const btnAmbitos = document.querySelectorAll('.btn-ambito');
    const claseOptions = document.querySelectorAll('.clase-option');
    const sociedadRadios = document.querySelectorAll('.sociedad-radio');
    const sociedadFields = document.getElementById('sociedadFields');
    const sociedadPais = document.getElementById('sociedadPais');
    const sociedadNombre = document.getElementById('sociedadNombre');
    
    // Verificar que los elementos existan
    if (!sociedadFields) {
        console.error('Elemento sociedadFields no encontrado');
        return;
    }
    if (!sociedadPais) {
        console.error('Elemento sociedadPais no encontrado');
        return;
    }
    if (!sociedadNombre) {
        console.error('Elemento sociedadNombre no encontrado');
        return;
    }
    
    console.log('Elementos de sociedad encontrados:', {
        sociedadFields: !!sociedadFields,
        sociedadPais: !!sociedadPais,
        sociedadNombre: !!sociedadNombre
    });
    
    // Manejador de eventos para los botones de ámbito
    function manejarSeleccionAmbito(event) {
        const btn = event.currentTarget;
        const ambito = btn.dataset.ambito;
        const inputHidden = document.getElementById(`ambito${ambito.charAt(0).toUpperCase() + ambito.slice(1)}`);
        
        // Alternar la clase active en el botón
        btn.classList.toggle('active');
        
        // Actualizar el valor del input hidden
        if (btn.classList.contains('active')) {
            inputHidden.value = ambito === 'Audiovisual' ? 'Audiovisual' : 'Dramático';
        } else {
            inputHidden.value = '';
        }
        
        // Actualizar las clases disponibles
        actualizarClasesDisponibles();
    }
    
    // Actualizar las clases disponibles según los ámbitos seleccionados
    function actualizarClasesDisponibles() {
        const ambitosSeleccionados = Array.from(btnAmbitos).filter(btn => btn.classList.contains('active'));
        
        // Si no hay ningún ámbito seleccionado, deshabilitar todas las opciones
        if (ambitosSeleccionados.length === 0) {
            claseOptions.forEach(option => {
                option.classList.remove('activo');
                const input = option.querySelector('input');
                if (input) input.disabled = true;
            });
            document.getElementById('claseError').textContent = 'Seleccione al menos un ámbito';
            return;
        }
        
        // Limpiar mensaje de error
        document.getElementById('claseError').textContent = '';
        
        // Obtener los ámbitos seleccionados
        const ambitosActivos = ambitosSeleccionados.map(btn => btn.dataset.ambito);
        
        // Actualizar las opciones de clase según los ámbitos seleccionados
        claseOptions.forEach(option => {
            const ambitoClase = option.dataset.ambito;
            const input = option.querySelector('input');
            
            if (ambitosActivos.includes(ambitoClase)) {
                option.classList.add('activo');
                if (input) input.disabled = false;
            } else {
                option.classList.remove('activo');
                if (input) {
                    input.checked = false;
                    input.disabled = true;
                }
            }
        });
    }
    
    // Manejador de eventos para la selección de sociedad
    function toggleSociedadFields(event) {
        const mostrarCampos = event.target.value === 'si';
        const camposSociedad = document.querySelector('.sociedad-fields');
        
        if (mostrarCampos) {
            // Habilitar los campos
            sociedadPais.disabled = false;
            sociedadNombre.disabled = false;
            
            // Mostrar los campos de sociedad
            camposSociedad.classList.add('activo');
            
            // Inicializar Select2 para los campos de sociedad
            $(sociedadPais).select2({
                placeholder: 'Seleccione un país',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true,
                disabled: false
            });
            
            $(sociedadNombre).select2({
                placeholder: 'Seleccione una sociedad',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true,
                disabled: false
            });
            
            // Inicializar Select2 para el país
            $(sociedadPais).select2({
                placeholder: 'Seleccione un país',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true,
                disabled: false
            });
            
            // Inicializar Select2 para la sociedad
            $(sociedadNombre).select2({
                placeholder: 'Seleccione una sociedad',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true,
                disabled: false
            });
            
            // Agregar un solo event listener para el cambio de país
            $(sociedadPais).off('change.sociedad').on('change.sociedad', cargarSociedadesPorPais);
            
            console.log('Event listeners configurados para cambio de país');
            
            // Cargar países en el selector de países
            cargarPaisesSociedades();
            
            console.log('Campos de sociedad habilitados y Select2 inicializado');
        } else {
            // Ocultar los campos de sociedad
            camposSociedad.classList.remove('activo');
            
            // Deshabilitar los campos
            sociedadPais.disabled = true;
            sociedadNombre.disabled = true;
            
            // Limpiar los valores
            $(sociedadPais).val(null).trigger('change');
            $(sociedadNombre).empty().append(new Option('Seleccione una sociedad', '')).trigger('change');
            
            // Actualizar Select2
            if ($(sociedadPais).hasClass('select2-hidden-accessible')) {
                $(sociedadPais).select2('enable', false);
            }
            
            if ($(sociedadNombre).hasClass('select2-hidden-accessible')) {
                $(sociedadNombre).select2('enable', false);
            }
            
            // Remover event listeners
            $(sociedadPais).off('change');
            $(sociedadPais).off('select2:select');
            
            console.log('Campos de sociedad deshabilitados');
        }
    }
    
    // Función para cargar países en el selector de sociedades
    async function cargarPaisesSociedades() {
        console.log('Función cargarPaisesSociedades ejecutada');
        try {
            console.log('Iniciando fetch de sociedades.json');
            const response = await fetch('assets/sociedades.json');
            console.log('Respuesta del fetch:', response.status, response.ok);
            if (!response.ok) throw new Error('No se pudo cargar el archivo de sociedades');
            const sociedades = await response.json();
            console.log('Sociedades cargadas del JSON:', sociedades.length);
            
            // Obtener países únicos
            const paises = [...new Set(sociedades.map(s => s.País))];
            console.log('Países únicos encontrados:', paises);
            
            // Limpiar opciones existentes usando Select2
            $(sociedadPais).empty().append(new Option('Seleccione un país', ''));
            
            // Agregar opciones de países usando Select2
            paises.forEach(pais => {
                const option = new Option(pais, pais);
                $(sociedadPais).append(option);
            });
            
            // Inicializar Select2 después de cargar las opciones
            $(sociedadPais).trigger('change');
            
            console.log(`Cargados ${paises.length} países en el selector de sociedades`);
            
        } catch (error) {
            console.error('Error al cargar las sociedades:', error);
        }
    }
    
    // Manejador de eventos para cuando cambia el país
    function cargarSociedadesPorPais() {
        // Usar el valor directamente del select2 para asegurar consistencia
        const paisSeleccionado = $(sociedadPais).val();
        
        console.log('=== CAMBIO DE PAÍS ===');
        console.log('País seleccionado:', paisSeleccionado);
        
        // Limpiar y deshabilitar temporalmente el select de sociedades
        $(sociedadNombre).empty().append(new Option('Cargando sociedades...', '', true, true));
        $(sociedadNombre).prop('disabled', true).trigger('change');
        
        if (!paisSeleccionado) {
            console.log('No hay país seleccionado, limpiando sociedades');
            // Actualizar Select2 con opción por defecto
            $(sociedadNombre).empty()
                .append(new Option('Seleccione una sociedad', '', true, true))
                .prop('disabled', true)
                .trigger('change');
            return;
        }
        
        console.log('Cargando sociedades para país:', paisSeleccionado);
        
        // Cargar sociedades del país seleccionado
        fetch('assets/sociedades.json')
            .then(response => {
                if (!response.ok) throw new Error('Error al cargar las sociedades');
                return response.json();
            })
            .then(sociedades => {
                const sociedadesFiltradas = sociedades.filter(s => s.País === paisSeleccionado);
                console.log(`Encontradas ${sociedadesFiltradas.length} sociedades para ${paisSeleccionado}`);
                
                // Limpiar y preparar el select de sociedades
                const $selectSociedad = $(sociedadNombre);
                $selectSociedad.empty().append(new Option('Seleccione una sociedad', '', true, true));
                
                // Agregar las sociedades encontradas
                if (sociedadesFiltradas.length > 0) {
                sociedadesFiltradas.forEach(sociedad => {
                        $selectSociedad.append(new Option(sociedad.Sociedad, sociedad.Sociedad));
                    });
                } else {
                    console.log('No se encontraron sociedades para el país seleccionado');
                    $selectSociedad.append(new Option('No hay sociedades disponibles', '', true, true));
                }
                
                // Habilitar y actualizar el select
                $selectSociedad.prop('disabled', false).trigger('change');
                console.log('Sociedades cargadas correctamente');
            })
            .catch(error => {
                console.error('Error al cargar las sociedades:', error);
                $(sociedadNombre)
                    .empty()
                    .append(new Option('Error al cargar las sociedades', '', true, true))
                    .prop('disabled', true)
                    .trigger('change');
            });
    }
    
    // Agregar event listeners
    btnAmbitos.forEach(btn => {
        btn.addEventListener('click', manejarSeleccionAmbito);
    });
    
    sociedadRadios.forEach(radio => {
        radio.addEventListener('change', toggleSociedadFields);
    });
    
    // Inicializar estado inicial
    actualizarClasesDisponibles();
    
    // Validación personalizada para asegurar que se seleccione al menos una clase
    const form = document.getElementById('socioForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            const formSection = document.querySelector('#datosTecnicos');
            if (formSection && formSection.classList.contains('active')) {
                // Validar que se haya seleccionado al menos un ámbito
                const ambitosSeleccionados = Array.from(btnAmbitos).filter(btn => btn.classList.contains('active'));
                if (ambitosSeleccionados.length === 0) {
                    event.preventDefault();
                    document.getElementById('ambitoError').textContent = 'Seleccione al menos un ámbito';
                    return;
                }
                
                // Nueva validación por ámbito:
                const ambitosActivos = ambitosSeleccionados.map(btn => btn.dataset.ambito);
                let errorClase = false;
                let mensajeError = '';
                ambitosActivos.forEach(ambito => {
                    const claseMarcada = document.querySelector('.clase-option[data-ambito="' + ambito + '"] input[type="checkbox"]:checked');
                    if (!claseMarcada) {
                        errorClase = true;
                        mensajeError += `Debe seleccionar al menos una clase para el ámbito ${ambito}. `;
                    }
                });
                if (errorClase) {
                    event.preventDefault();
                    document.getElementById('claseError').textContent = mensajeError.trim();
                    return;
                }
                
                // Validar campos de sociedad si es necesario
                const sociedadSeleccionada = document.querySelector('input[name="perteneceSociedad"]:checked');
                if (sociedadSeleccionada && sociedadSeleccionada.value === 'si') {
                    if (!sociedadPais.value) {
                        event.preventDefault();
                        document.getElementById('sociedadPaisError').textContent = 'Seleccione un país';
                        return;
                    }
                    
                    if (!sociedadNombre.value) {
                        event.preventDefault();
                        document.getElementById('sociedadNombreError').textContent = 'Seleccione una sociedad';
                        return;
                    }
                }
                
                // Validar sección de obras
                const formSectionObras = document.querySelector('#obras');
                if (formSectionObras && formSectionObras.classList.contains('active')) {
                    const obras = document.querySelectorAll('.obra-item');
                    let obrasValidas = 0;
                    
                    obras.forEach(obra => {
                        const titulo = obra.querySelector('input[name="tituloObra[]"]');
                        const ambitoObra = obra.querySelector('select[name="ambitoObra[]"]');
                        
                        if (titulo && ambitoObra && titulo.value.trim() && ambitoObra.value) {
                            obrasValidas++;
                        }
                    });
                    
                    if (obrasValidas === 0) {
                        event.preventDefault();
                        // Mostrar mensaje de error en la primera obra
                        const primeraObra = document.querySelector('.obra-item');
                        if (primeraObra) {
                            const errorTitulo = primeraObra.querySelector('.form-group:first-child .error-message');
                            const errorAmbito = primeraObra.querySelector('.form-group:last-child .error-message');
                            
                            if (errorTitulo) errorTitulo.textContent = 'Debe ingresar al menos una obra completa';
                            if (errorAmbito) errorAmbito.textContent = 'Debe seleccionar un ámbito';
                        }
                        return;
                    }
                }
            }
        });
    }
}

// Función para inicializar los selectores de código de país
async function inicializarSelectorCodigoPais() {
    try {
        const response = await fetch('assets/paisestel.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo de códigos de país');
        }
        const paises = await response.json();
        
        // Configuración común para los selectores de código de país
        const configuracionSelectores = [
            { id: 'codigoPais', telefonoId: 'telefono' },
            { id: 'apoderadoCodigoPais', telefonoId: 'apoderadoTelefono' },
            { id: 'sucesionCodigoPais', telefonoId: 'sucesionTelefono' }
        ];
        
        // Ordenar países alfabéticamente
        paises.sort((a, b) => a.Paises.localeCompare(b.Paises));
        
        // Inicializar cada selector
        configuracionSelectores.forEach(config => {
            const select = document.getElementById(config.id);
            if (!select) return;
            
            // Limpiar opciones existentes
            select.innerHTML = '<option value="">Seleccione un país</option>';
            
            // Limpiar opciones existentes
            select.innerHTML = '';
            
            // Agregar opciones y marcar Chile como seleccionado
            paises.forEach(pais => {
                const option = document.createElement('option');
                option.textContent = `${pais.Paises} (${pais['Código tel']})`;
                option.value = pais['Código tel'];
                option.dataset.pais = pais.Paises;
                if (pais.Paises === 'Chile') {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            
            // Inicializar Select2
            $(select).select2({
                placeholder: 'Seleccione un país',
                templateResult: formatPais,
                templateSelection: formatPaisSeleccionado,
                width: '100%',
                dropdownAutoWidth: true,
                language: {
                    noResults: function() {
                        return "No se encontraron resultados";
                    },
                    searching: function() {
                        return "Buscando...";
                    }
                }
            });
            
            // Forzar la actualización visual
            if (select.id === 'codigoPais' || select.id === 'apoderadoCodigoPais') {
                $(select).val('+56').trigger('change');
            }
            
            // Validar que solo se ingresen números en el campo de teléfono correspondiente
            const telefonoInput = document.getElementById(config.telefonoId);
            if (telefonoInput) {
                telefonoInput.addEventListener('input', function(e) {
                    this.value = this.value.replace(/[^0-9]/g, '');
                });
            }
        });
        
    } catch (error) {
        console.error('Error al cargar los códigos de país:', error);
    }
}

// Función para formatear la visualización de los países en el dropdown
function formatPais(pais) {
    if (!pais.id) { return pais.text; }
    const $pais = $(
        '<span>' + pais.text + '</span>'
    );
    return $pais;
}

// Función para formatear la visualización del país seleccionado
function formatPaisSeleccionado(pais) {
    if (!pais.id) { return 'Seleccione un país'; }
    return $('<span>' + pais.text + '</span>');
}

// Función para inicializar los grupos de entrada dinámica
function inicializarGruposDinamicos() {
    console.log("Intentando inicializar grupos dinámicos...");

    // Función helper para añadir el listener de eliminación
    function addRemoveListener(button, container, counter) {
        button.addEventListener('click', function() {
            removeInput(container, this.closest('.input-with-actions'), counter);
        });
    }

    // Manejador para agregar nuevos campos
    // Seleccionamos solo los botones que NO han sido inicializados
    document.querySelectorAll('.btn-add-input:not([data-initialized])').forEach(button => {
        // Eliminar listeners previos reemplazando el botón por un clon
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        button = newButton;
        console.log("Inicializando botón de AGREGAR:", button.getAttribute('data-target'));
        button.addEventListener('click', function() {
            // ... (código interno del click sin cambios)
            const targetId = this.getAttribute('data-target');
            const container = document.getElementById(targetId);
            const inputs = container.querySelectorAll('.input-with-actions');
            const counter = this.nextElementSibling;
            
            if (inputs.length >= 5) return;

            const template = inputs[0];
            const newInput = template.cloneNode(true);
            const inputField = newInput.querySelector('input[type="text"]');
            inputField.value = '';
            
            newInput.classList.remove('dynamic-input-exit');
            newInput.classList.add('dynamic-input-enter');
            
            const removeBtn = newInput.querySelector('.btn-remove-input');
            removeBtn.style.display = 'flex';
            
            addRemoveListener(removeBtn, container, counter);

            container.appendChild(newInput);
            updateCounter(counter, container);
            inputField.focus();
        });
        // Marcamos el botón como inicializado
        button.setAttribute('data-initialized', 'true');
    });
    
    // Función para actualizar el contador (código restaurado)
    function updateCounter(counter, container) {
        const currentCount = container.querySelectorAll('.input-with-actions').length;
        if(counter) counter.querySelector('.current-count').textContent = currentCount;
    }
    
    // Función para eliminar un campo (código restaurado)
    function removeInput(container, inputToRemove, counter) {
        const inputs = container.querySelectorAll('.input-with-actions');
        if (inputs.length <= 1) return;
        
        inputToRemove.classList.remove('dynamic-input-enter');
        inputToRemove.classList.add('dynamic-input-exit');
        
        setTimeout(() => {
            container.removeChild(inputToRemove);
            updateCounter(counter, container);
        }, 300);
    }
    
    // Inicializar listeners de eliminación para los campos existentes que no lo tengan
    document.querySelectorAll('.dynamic-input-container').forEach(container => {
        const removeButtons = container.querySelectorAll('.btn-remove-input:not([data-initialized])');
        const counter = container.closest('.dynamic-input-group').querySelector('.input-counter');
        
        removeButtons.forEach(btn => {
            const currentInput = btn.closest('.input-with-actions');
            const isFirst = currentInput === container.querySelector('.input-with-actions');
            if (!isFirst) {
                 console.log("Inicializando botón de ELIMINAR existente.");
                 addRemoveListener(btn, container, counter);
            }
            btn.setAttribute('data-initialized', 'true');
        });
    });

    // Inicializar contadores al cargar (código restaurado)
    document.querySelectorAll('.dynamic-input-group').forEach(group => {
        const container = group.querySelector('.dynamic-input-container');
        const counter = group.querySelector('.input-counter');
        if (container && counter) {
            updateCounter(counter, container);
        }
    });
}

// Inicializar grupos dinámicos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarGruposDinamicos();
});

// Función para inicializar la funcionalidad de obras dinámicas
function inicializarObrasDinamicas() {
    const obrasList = document.getElementById('obrasList');
    const btnAddObra = document.getElementById('btnAddObra');
    const obrasCounter = document.querySelector('.obras-counter .current-count');
    
    if (!obrasList || !btnAddObra) {
        console.error('Elementos de obras no encontrados');
        return;
    }
    
    let obraCount = 1;
    const maxObras = 10;
    
    // Función para actualizar el contador
    function updateObrasCounter() {
        // Actualizar el nuevo contador visual
        const counterNumber = document.querySelector('.obras-counter-number');
        if (counterNumber) {
            counterNumber.textContent = obraCount;
        }
        
        // Habilitar/deshabilitar botón de agregar
        btnAddObra.disabled = obraCount >= maxObras;
        
        // Mostrar/ocultar botones de eliminar
        const removeButtons = document.querySelectorAll('.btn-remove-obra');
        removeButtons.forEach((btn, index) => {
            btn.style.display = obraCount > 1 ? 'flex' : 'none';
        });
    }
    
    // Función para crear una nueva obra
    function createObraItem(obraId) {
        const obraItem = document.createElement('div');
        obraItem.className = 'obra-item obra-enter';
        obraItem.setAttribute('data-obra-id', obraId);
        
        obraItem.innerHTML = `
            <div class="obra-header">
                <div class="obra-header-left">
                    <div class="obra-icon">🎬</div>
                    <span class="obra-number">Obra ${obraId}</span>
                </div>
                <button type="button" class="btn-remove-obra" title="Eliminar obra">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <div class="floating-label">
                        <input type="text" id="tituloObra${obraId}" name="tituloObra[]" class="form-control" required>
                        <label for="tituloObra${obraId}">Título <span class="required">*</span></label>
                        <div class="error-message"></div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="floating-label">
                        <input type="number" id="anioEstrenoObra${obraId}" name="anioEstrenoObra[]" class="form-control" min="1500" max="2100" required>
                        <label for="anioEstrenoObra${obraId}">Año de estreno <span class="required">*</span></label>
                        <div class="error-message"></div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="floating-label">
                        <select id="ambitoObra${obraId}" name="ambitoObra[]" class="form-control select2" required>
                            <option value="">Seleccione un ámbito</option>
                            <option value="Audiovisual">Audiovisual</option>
                            <option value="Dramatico">Dramático</option>
                        </select>
                        <label for="ambitoObra${obraId}">Ámbito <span class="required">*</span></label>
                        <div class="error-message"></div>
                    </div>
                </div>
            </div>
        `;
        
        return obraItem;
    }
    
    // Función para agregar una nueva obra
    function addObra() {
        if (obraCount >= maxObras) return;
        
        obraCount++;
        const newObra = createObraItem(obraCount);
        obrasList.appendChild(newObra);
        
        // Inicializar Select2 para el nuevo select
        const newSelect = newObra.querySelector('select');
        if (newSelect) {
            $(newSelect).select2({
                placeholder: 'Seleccione un ámbito',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true
            });
            // Forzar cierre del dropdown al seleccionar
            $(newSelect).on('select2:select', function(e) {
                $(this).select2('close');
            });
        }
        
        // Agregar event listener para eliminar
        const removeBtn = newObra.querySelector('.btn-remove-obra');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removeObra(newObra));
        }
        
        // Agregar event listeners para validación
        const tituloInput = newObra.querySelector('input[type="text"]');
        const ambitoSelect = newObra.querySelector('select');
        
        if (tituloInput) {
            tituloInput.addEventListener('blur', () => validarCampo(tituloInput));
            tituloInput.addEventListener('input', () => validarCampo(tituloInput));
        }
        
        if (ambitoSelect) {
            $(ambitoSelect).on('change', () => validarCampo(ambitoSelect));
            // Forzar cierre del dropdown al seleccionar
            $(ambitoSelect).on('select2:select', function(e) {
                $(this).select2('close');
            });
        }
        
        updateObrasCounter();
        
        // Remover clase de animación después de la animación
        setTimeout(() => {
            newObra.classList.remove('obra-enter');
        }, 300);
        
        // Enfocar el nuevo campo de título
        setTimeout(() => {
            tituloInput.focus();
        }, 350);
    }
    
    // Función para eliminar una obra
    function removeObra(obraItem) {
        if (obraCount <= 1) return;
        
        obraItem.classList.add('obra-exit');
        
        setTimeout(() => {
            obrasList.removeChild(obraItem);
            obraCount--;
            
            // Renumerar las obras restantes
            const obrasRestantes = document.querySelectorAll('.obra-item');
            obrasRestantes.forEach((obra, index) => {
                const obraId = index + 1;
                obra.setAttribute('data-obra-id', obraId);
                const numeroSpan = obra.querySelector('.obra-number');
                if (numeroSpan) {
                    numeroSpan.textContent = `Obra ${obraId}`;
                }
                
                // Actualizar IDs de los campos
                const tituloInput = obra.querySelector('input[type="text"]');
                const ambitoSelect = obra.querySelector('select');
                
                if (tituloInput) {
                    tituloInput.id = `tituloObra${obraId}`;
                    const tituloLabel = obra.querySelector('label[for^="tituloObra"]');
                    if (tituloLabel) {
                        tituloLabel.setAttribute('for', `tituloObra${obraId}`);
                    }
                }
                
                if (ambitoSelect) {
                    ambitoSelect.id = `ambitoObra${obraId}`;
                    const ambitoLabel = obra.querySelector('label[for^="ambitoObra"]');
                    if (ambitoLabel) {
                        ambitoLabel.setAttribute('for', `ambitoObra${obraId}`);
                    }
                }
            });
            
            updateObrasCounter();
        }, 300);
    }
    
    // Event listener para agregar obra
    btnAddObra.addEventListener('click', addObra);
    
    // Event listeners para la primera obra
    const primeraObra = document.querySelector('.obra-item');
    if (primeraObra) {
        const tituloInput = primeraObra.querySelector('input[type="text"]');
        const ambitoSelect = primeraObra.querySelector('select');
        
        if (tituloInput) {
            tituloInput.addEventListener('blur', () => validarCampo(tituloInput));
            tituloInput.addEventListener('input', () => validarCampo(tituloInput));
        }
        
        if (ambitoSelect) {
            $(ambitoSelect).select2({
                placeholder: 'Seleccione un ámbito',
                width: '100%',
                dropdownAutoWidth: true,
                allowClear: true
            });
            $(ambitoSelect).on('change', () => validarCampo(ambitoSelect));
            // Forzar cierre del dropdown al seleccionar
            $(ambitoSelect).on('select2:select', function(e) {
                $(this).select2('close');
            });
        }
    }
    
    // Inicializar contador
    updateObrasCounter();
    
    console.log('Funcionalidad de obras dinámicas inicializada');
}

const totalSecciones = document.querySelectorAll('.form-section').length;
let datosGeneralesInicializados = false;

// Función para mostrar notificaciones visuales
function mostrarNotificacion(mensaje, tipo = 'success') {
    // Elimina notificaciones previas
    const notiExistente = document.getElementById('noti-formulario');
    if (notiExistente) notiExistente.remove();
    // Crea el contenedor
    const noti = document.createElement('div');
    noti.id = 'noti-formulario';
    noti.textContent = mensaje;
    noti.style.position = 'fixed';
    noti.style.top = '30px';
    noti.style.left = '50%';
    noti.style.transform = 'translateX(-50%)';
    noti.style.padding = '16px 32px';
    noti.style.borderRadius = '8px';
    noti.style.zIndex = '9999';
    noti.style.fontSize = '1.1rem';
    noti.style.color = '#fff';
    noti.style.background = tipo === 'success' ? '#097137' : '#a0202d';
    noti.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
    document.body.appendChild(noti);
    setTimeout(() => {
        noti.remove();
    }, 4000);
    if (tipo === 'success') {
        const btnDescargarPDF = document.getElementById('btnDescargarPDF');
        if (btnDescargarPDF) btnDescargarPDF.style.display = 'block';
    }
}



let formularioEnviado = false;

// Mostrar botón de descarga PDF tras el envío exitoso
document.addEventListener('DOMContentLoaded', function() {
    const btnDescargarPDF = document.getElementById('btnDescargarPDF');
    if (btnDescargarPDF) {
        btnDescargarPDF.style.display = 'block';
        btnDescargarPDF.addEventListener('click', async function() {
            const formContainer = document.querySelector('.form-container');
            if (!formContainer) return;
            btnDescargarPDF.disabled = true;
            btnDescargarPDF.textContent = 'Generando PDF...';

            // 1. Guardar el estado original de las secciones
            const secciones = Array.from(document.querySelectorAll('.form-section'));
            const estadoOriginal = secciones.map(sec => ({
                id: sec.id,
                display: sec.style.display,
                active: sec.classList.contains('active')
            }));

            // 2. Mostrar todas las secciones
            secciones.forEach(sec => {
                sec.style.display = 'block';
                sec.classList.remove('active');
            });

            // 3. Capturar el formulario
            await html2canvas(formContainer, {scale:2, useCORS:true}).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new window.jspdf.jsPDF({unit: 'px', format: 'a4'});
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = pageWidth / imgWidth;
                const scaledHeight = imgHeight * ratio;
                let position = 0;

                // Primera página
                pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, scaledHeight);
                position -= pageHeight;

                // Si la imagen es más alta que una página, agregar más páginas
                while (Math.abs(position) + pageHeight < scaledHeight) {
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, scaledHeight);
                    position -= pageHeight;
                }
                pdf.save('Formulario-Postulacion-ATN.pdf');
            });

            // 4. Restaurar el estado original
            estadoOriginal.forEach(({id, display, active}) => {
                const sec = document.getElementById(id);
                if (sec) {
                    sec.style.display = display;
                    if (active) {
                        sec.classList.add('active');
                    } else {
                        sec.classList.remove('active');
                    }
                }
            });

            btnDescargarPDF.disabled = false;
            btnDescargarPDF.textContent = 'Descargar PDF del formulario';
        });
    }
});

// === VALIDACIÓN PERSONALIZADA DE CAMPOS VISIBLES Y REQUERIDOS ===
function validarCamposVisiblesRequeridos(seccion) {
    let valido = true;
    // Validar checkboxes de derechos si estamos en la sección correspondiente
    if (seccion && seccion.id === 'derechosAdministrar') {
        const checkboxes = [
            document.getElementById('confirmacionObras'),
            document.getElementById('derechosComunicacion'),
            document.getElementById('autorizacionDatos')
        ];
        const todosMarcados = checkboxes.every(checkbox => checkbox && checkbox.checked);
        const mensajeValidacion = document.getElementById('derechosValidationMessage');
        if (!todosMarcados) {
            valido = false;
            if (mensajeValidacion) mensajeValidacion.classList.add('show');
        } else {
            if (mensajeValidacion) mensajeValidacion.classList.remove('show');
        }
    }
    // Validar archivos de Documentos a Firmar

    // Validar los campos requeridos visibles normales
    const campos = seccion.querySelectorAll('input[required], select[required], textarea[required]');
    campos.forEach(campo => {
        // Solo validar si el campo está visible
        const esVisible = campo.offsetParent !== null;
        if (esVisible) {
            if (!validarCampo(campo)) {
                valido = false;
            }
        }
    });
    return valido;
}

// Mostrar mensaje de validación de documentos a firmar al entrar a la sección si faltan archivos
const secciones = document.querySelectorAll('.form-section');
secciones.forEach(seccion => {
    if (seccion.id === 'documentosFirmar') {
        seccion.addEventListener('sectionShown', function() {
            const solicitud = document.getElementById('solicitudFirmada');
            const mandato = document.getElementById('mandatoFirmado');
            // const firma = document.getElementById('firmaPostulante'); // Ya no se valida como obligatoria
            const mensajeValidacion = document.getElementById('documentosValidationMessage');
            let archivosValidos = true;
            if (!solicitud || !solicitud.files || solicitud.files.length === 0) {
                archivosValidos = false;
            }
            if (!mandato || !mandato.files || mandato.files.length === 0) {
                archivosValidos = false;
            }
            if (!archivosValidos && mensajeValidacion) {
                mensajeValidacion.classList.add('show');
            } else if (mensajeValidacion) {
                mensajeValidacion.classList.remove('show');
            }
        });
    }
});

// Lanzar el evento personalizado al mostrar una sección
function mostrarSeccion(id) {
    // ... existente ...
    const seccion = document.getElementById(id);
    if (seccion) {
        // ... existente ...
        const event = new CustomEvent('sectionShown');
        seccion.dispatchEvent(event);
    }
    // ... existente ...
}

// ... existente ...
    // Corregir validación visual de los campos select2 obligatorios
    $('.select2').on('change', function() {
        if (this.required && this.value) {
            this.classList.remove('is-invalid');
            const errorElement = this.closest('.form-group')?.querySelector('.error-message');
            if (errorElement) errorElement.textContent = '';
        }
    });
// ... existente ...

// Función para ver documentos generados automáticamente
function verDocumentoGenerado(tipo) {
    let url = '';
    let titulo = '';
    
    if (tipo === 'antecedentes') {
        url = './docs/ANTECEDENTES_GENERALES-1.pdf';
        titulo = 'Antecedentes Generales';
    } else if (tipo === 'pagos') {
        url = './docs/PAGOS.pdf';
        titulo = 'Declaración de Pagos';
    }
    
    if (url) {
        // Abrir en nueva pestaña para vista previa
        window.open(url, '_blank');
    } else {
        alert('Documento no disponible.');
    }
}
