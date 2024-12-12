document.addEventListener('DOMContentLoaded', () => {
    const flowContainer = document.getElementById('flow-container');
    const addStepButton = document.getElementById('add-step-button');
    const modal = document.getElementById('edit-modal');
    const closeModal = document.querySelector('.close');
    const saveStepButton = document.getElementById('save-step-button');
    const addOptionButton = document.getElementById('add-option-button');
    const stepNameInput = document.getElementById('step-name');
    const stepMessageInput = document.getElementById('step-message');
    const stepOptionsContainer = document.getElementById('step-options');
    let flowData = {};
    let currentStep = null;

    // Cargar flujo
    async function loadFlow() {
        try {
            const response = await fetch('/api/flow');
            flowData = await response.json();
            renderFlow();
        } catch (error) {
            console.error('Error al cargar el flujo:', error);
        }
    }

    // Renderizar tarjetas del flujo
    function renderFlow() {
        flowContainer.innerHTML = '';
        Object.keys(flowData).forEach((step) => {
            const card = document.createElement('div');
            card.className = 'flow-card';
            card.innerHTML = `
                <h3>${step}</h3>
                <p>${flowData[step].message}</p>
                <ul>
                    ${Object.keys(flowData[step])
                        .filter((key) => key !== 'message' && key !== 'default')
                        .map((key) => `<li>${key} → ${flowData[step][key]}</li>`)
                        .join('')}
                </ul>
                <button class="edit-step" data-step="${step}">Editar</button>
            `;
            flowContainer.appendChild(card);

            card.querySelector('.edit-step').addEventListener('click', () => openModal(step));
        });
    }

    // Abrir modal
    function openModal(step) {
        currentStep = step;
        const stepData = flowData[step];
        stepNameInput.value = step;
        stepMessageInput.value = stepData.message;
        renderOptions(stepData);
        modal.style.display = 'block';
    }

    // Renderizar opciones
    function renderOptions(stepData) {
        stepOptionsContainer.innerHTML = '';
        Object.keys(stepData)
            .filter((key) => key !== 'message' && key !== 'default')
            .forEach((key) => {
                const optionDiv = document.createElement('div');
                optionDiv.innerHTML = `
                    <input type="text" class="option-key" value="${key}" />
                    <input type="text" class="option-value" value="${stepData[key]}" />
                    <button class="delete-option">Eliminar</button>
                `;
                stepOptionsContainer.appendChild(optionDiv);

                optionDiv.querySelector('.delete-option').addEventListener('click', () => {
                    optionDiv.remove();
                });
            });
    }

    // Guardar cambios en el paso
    saveStepButton.addEventListener('click', () => {
        const stepData = {
            message: stepMessageInput.value,
        };
        document.querySelectorAll('.option-key').forEach((input, index) => {
            const key = input.value;
            const value = document.querySelectorAll('.option-value')[index].value;
            stepData[key] = value;
        });
        flowData[currentStep] = stepData;
        modal.style.display = 'none';
        renderFlow();
    });

    // Cerrar modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    loadFlow();
});
