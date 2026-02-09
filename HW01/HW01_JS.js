//Get elements
const form = document.getElementById('calcForm');
const resultP = document.getElementById('result');
const toggleButton = document.getElementById('toggleButton');
const num1Input = document.getElementById('num1');
const num2Input = document.getElementById('num2');

//preventDefault prevents the form submission
form.addEventListener('submit', (event) => {
    event.preventDefault()
    // Get values
    const num1 = parseFloat(num1Input.value);
    const num2 = parseFloat(num2Input.value);
    const operation = event.submitter.value;
    
    // Calculate result
    let result;
    switch(operation) {
        case 'add':
            result = num1 + num2;
            break;
        case 'subtract':
            result = num1 - num2;
            break;
        case 'multiply':
            result = num1 * num2;
            break;
        case 'divide':
            result = num2 !== 0 ? num1 / num2 : 'Cannot divide by zero';
            break;
    }

    // Display result
    resultP.textContent = `Result: ${result}`;
            
    //Remove existing info
    const existingInfo = document.getElementById('extraInfo');
    if (existingInfo) {
        //Remove element from DOM
        existingInfo.remove(); 
    }

    // CREATE new element and add to DOM
    const extraInfo = document.createElement('p');
    extraInfo.id = 'extraInfo';
    extraInfo.textContent = `Operation: ${operation.toUpperCase()}`;
    extraInfo.style.marginTop = '10px';
    extraInfo.style.fontStyle = 'italic';
    extraInfo.style.color = '#666';
    extraInfo.style.display = 'block';
    //Adds element to DOM
    resultP.appendChild(extraInfo); 
})
// Change the background color attribute
toggleButton.addEventListener('click', () => {
    // Change the style attribute of resultP
    if (resultP.style.backgroundColor === 'lightblue') {
        resultP.setAttribute('style', resultP.getAttribute('style').replace('background-color: lightblue', 'background-color: lightgreen'));
    } 
    else {
        resultP.setAttribute('style', resultP.getAttribute('style').replace('background-color: lightgreen', 'background-color: lightblue'));
    }
})