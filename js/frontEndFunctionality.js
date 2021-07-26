    const path = "http://localhost:5000"; // path to backend server goes here.
    const filePath = "http://localhost:5500";

    async function login(){
        const userName = document.getElementById("userName").value;
        const passWord = document.getElementById("passWord").value;
        
        const response = await fetch(path + "/login", {method: 'POST',
        body: JSON.stringify({"userName": userName, "passWord": passWord}),
        mode: 'cors',
         credentials: 'same-origin',
         headers: {
             'Content-Type': 'application/json',
         }
        });
        if(response.status == 404){
            alert("invalid login credentials")
        }
        const user = await response.json();
        //Store login information in local storage for checking login credentials on later pagers.
        window.localStorage.setItem('employeeId', user['employeeId']);
        window.localStorage.setItem('roleId', user['roleId']);
        if(user["roleId"]==0){
            //They are an employee, so redirect them to the employee page
            window.location.replace("\\employee.html");
        }
        if(user["roleId"]==1){
            //They are a manager, so redirect them to the manager page.
            window.location.replace(filePath + "\\manager.html");
        }
    }

    function checkLogin(){
        if(window.localStorage.getItem('roleId') == undefined){
            window.location.replace(filePath+"\\login.html");
        }
        if(document.title === "Employee" && window.localStorage.getItem('roleId')== 1){
            window.location.replace(filePath+"\\manager.html");
        }
        if(document.title === "Manager" && window.localStorage.getItem('roleId')== 0){
            window.location.replace(filePath+"\\employee.html")
        }
    }

    async function getAllReimbursements(){
        let response;
        if(window.localStorage.getItem('roleId') == 0){
            response = await fetch(path+`/employees/${window.localStorage.getItem('employeeId')}/reimbursements`);
        }
        else{
            response = await fetch(path+`/reimbursements`)
        }
        const body = await response.json();
        const theRest = document.getElementById('theRest')
        if(window.localStorage.getItem('roleId')==0){
            let tableBody = '<table class=\"table table-sm table-dark\"><tbody id=\'reimbursementTable\'><tr><th>Amount</th><th>Status</th><th>Reason</th></tr>'
            for(let record in body){
                tableBody += `<tr><td>${body[record]['amount']}</td><td>${body[record]['status']}</td><td>${body[record]['reason']}</td></tr>`
            }
            tableBody += '</tbody></table>'
            theRest.innerHTML = tableBody
        }
        else{
            theRest.innerHTML = '<button onclick=\'updateTable()\' id=\'tableButton\' name=\'pending\'>Past reimbursements</button><table class=\"table table-sm table-dark\"><tbody id=\'reimbursementTable\'><tr><th>Amount</th><th>Reason</th><th>Approve?</th></tr></tbody></table>'
            const tableBody =document.getElementById('reimbursementTable');
            for(record in body){
                if(body[record]['status'].toLowerCase() =='pending'){
                    tableBody.innerHTML += `<tr><td>${body[record]['amount']}</td><td>${body[record]['reason']}</td><td><button class=\'approveButtons\' id=\'${body[record]['reId']}\' onclick="approve(this.id)">Approve</button><button class=\'denyButtons\' id=\'${body[record]['reId']}\' onclick="deny(this.id)">Deny</button></td></tr>`
                }
            }
        }
    
    }

    async function updateTable(){
        const tableBody = document.getElementById('reimbursementTable');
        const switchButton = document.getElementById('tableButton');
        const response = await fetch(path+`/reimbursements`);
        const body = await response.json();
        if(switchButton.name === 'pending'){
            switchButton.name = 'past';
            switchButton.innerHTML = 'Pending';
            tableBody.innerHTML = '<tr><th>Amount</th><th>Reason</th><th>Status</th></tr>';
            for(let n in body){
                if(body[n]['status'].toLowerCase() != 'pending'){
                    tableBody.innerHTML += `<tr><td>${body[n]['amount']}</td><td>${body[n]['reason']}</td><td>${body[n]['status']}</tr>`;
                }
            }
        }
        else{
            switchButton.name = 'pending'
            switchButton.innerHTML = 'Past'
            tableBody.innerHTML = '<tr><th>Amount</th><th>Reason</th><th>Approve?</th></tr>';
        for(n in body){
            if(body[n]['status'].toLowerCase() == 'pending'){
                tableBody.innerHTML += `<tr><td>${body[n]['amount']}</td><td>${body[n]['reason']}</td>
                <td><button class=\'approveButtons\' id=\'${body[record]['reId']}\' onclick="approve(this.id)">Approve</button>
                <button class=\'denyButtons\' id=\'${body[record]['reId']}\' onclick="deny(this.id)">Deny</button></td></tr>`;
            }
        }
        }
    }

    async function getReimbursement(reId){
        const response = await fetch(path+`/reimbursements/${reId}`)
        return await response.json();
    }

    async function approve(reId){
        const reimbursement = await getReimbursement(reId);
        reimbursement.status='Approved'
        reimbursement.reason = prompt("Reason for approval?")
        config = 
        {   
            method: 'PATCH',
            body: JSON.stringify(reimbursement),
            mode: 'cors',
            credentials: 'same-origin',
            headers: 
            {
             'Content-Type': 'application/json'
            }
        };
        const response = await fetch(path+`/reimbursements/${reId}`, config)
        if(response.status == 200){
            console.log("approved Successfully");
            getAllReimbursements();
        }
    }

    async function deny(reId){
        const reimbursement = await getReimbursement(reId);
        reimbursement.status='Rejected'
        reimbursement.reason = prompt("REason for denial?")
        config = 
        {   
            method: 'PATCH',
            body: JSON.stringify(reimbursement),
            mode: 'cors',
            credentials: 'same-origin',
            headers: 
            {
             'Content-Type': 'application/json'
            }
        };
        response = await fetch(path+`/reimbursements/${reId}`, config)
        if(response.status == 200){
            console.log('Rejected Successfully');
            getAllReimbursements();
        }
    }

    function updateEmployeePage(){
        const theRest = document.getElementById('theRest');
        theRest.innerHTML = "<input id=\'amount\' placeholder= \'Enter Amount\'><input id=\'reason\' placeholder=\'Enter Reason\'><input type=\"file\" id=\"myFile\" name=\"filename\" accept=\".txt\"><button id=\'rrSubmit\' onclick=\'createReimbursement()\'>Submit</button>"
    }

    async function createReimbursement(){
        let amount = document.getElementById('amount');
        let reason = document.getElementById('reason');
        let file = document.getElementById('myFile')
        if(amount.value === "" && file.value === "" ){
            alert("amount is a required field");
        }
        else if(reason.value === "" && file.value === ""){
            alert("reason is a required field");
        }
        else if(file.value === ""){
            const employeeId = window.localStorage.getItem('employeeId');
            const rr = {
                reId: 0,
                employeeId: employeeId,
                amount: amount.value,
                status: 'Pending',
                reason: reason.value
            }
            const config = {method: 'POST',
            body: JSON.stringify(rr),
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
            };
            const response = await fetch(path+`/reimbursements`, config);
            console.log(response);
            if(response.status == 201){
                console.log("Created Successfully")
                updateEmployeePage();
            }
            else if(amount != "" && reason != ""){
                alert('Uh oh, something went wrong');
            }
        }
        else if(file.value !== ""){
            let reader = new FileReader();
            let text= " ";
            let readableFile = file.files[0];
            reader.readAsText(readableFile);
            reader.onload = function() {
                text = reader.result;
                console.log(text)
                console.log(reader.result)
            }
            reader.onloadend = async function (){
                const config = {
                    method: 'POST',
                    body: text,
                    mode: 'cors',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                const response = await fetch(path+'/reimbursements', config)
                if(response.status == 201){
                    console.log("Created Successfully")
                    updateEmployeePage();
                }
                else{
                    console.log('Uh oh, something went wrong');
                }
            }
        }
    }

    function logout(){
        window.localStorage.removeItem('employeeId');
        window.localStorage.removeItem('roleId');
        window.location.href = filePath+"\\login.html"
    }

    async function stats(){
        const theRest = document.getElementById('theRest');
        theRest.innerHTML = '<div class="container"><div class="reimbursementChart"><canvas id=\"myChart1\" width=\"50\" height=\"50\"></div><div class="rejectedChart"><canvas id=\"myChart2\" width=\"50\" height=\"50\"></canvas></div></div>'
        generateChart();
    }

    async function generateChart(){
        const response = await fetch(path+'/employees');
        const body = await response.json();
        const employeeIds = new Array();
        const employeeNames = new Array();
        for(n in body){
            employeeIds.push(body[n]['employeeId']);
            employeeNames.push(body[n]['firstName']);
        }
        const response1 = await fetch(path+'/reimbursements');
        const body1 = await response1.json();
        let employeeAmounts = [];
        let employeeRejected = [];
        for(n= 0; n < employeeIds.length; n++){
            employeeAmounts.push(0);
            employeeRejected.push(0);
        }
        for(n in body1){
            const index = employeeIds.indexOf(body1[n]['employeeId']);
            if(body1[n]['status'] == 'Approved' || body1[n]['status']=='Approved'.toLowerCase()){
                employeeAmounts[index] = employeeAmounts[index] + body1[n]['amount'];
            }
            if(body1[n]['status'] == 'Rejected' || body1[n]['status']=='Rejected'.toLowerCase()){
                employeeRejected[index] = employeeRejected[index] + body1[n]['amount'];
            }
        }
        console.log(employeeAmounts);
        
        let ctx1 = document.getElementById('myChart1').getContext('2d');
        let ctx2 = document.getElementById('myChart2').getContext('2d');
        let myChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: employeeNames,
                datasets: [{
                    label: 'Amount Approved',
                    data: employeeAmounts,
                    borderWidth: 1,
                    backgroundColor: 'rgba(0,255,0)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y:{
                        beginAtZero: true
                    }
                }
            }

        });
        let myChart2 = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: employeeNames,
                datasets: [{
                    label: 'Amount Rejcected',
                    data: employeeRejected,
                    borderWidth: 1,
                    backgroundColor: 'rgba(255,0,0)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y:{
                        beginAtZero: true
                        
                    }
                }
            }

        });
    }
