// ZDT1 function
function ZDT1(x) {
    let xi = 0;
    for (let i = 1; i < x.length; i++) {
        xi += x[i];
    }
    let g = 1 + (9 / (x.length - 1) * xi);
    let f1 = x[0];
    let f2 = g * (1 - Math.sqrt(f1 / g));
    return [f1, f2];
}
// Variable generation
function randomX() {
    return Math.random();
}
// Init
let nsga2 = new MOEA.NSGA2(10, 2, 20, 25, ZDT1, randomX);
nsga2.mutationRate = 0.1;
nsga2.crossoverRate = 0.5;
// Main function
let pop = nsga2.optimize();

/** Drawing Chart */
let frontData = [];
let otherData = [];
let r = 1;
for (let i of pop) {
    if (i.paretoRank == r) {
        frontData.push({ x: i.objectives[0], y: i.objectives[1] });
    }
    else {
        otherData.push({ x: i.objectives[0], y: i.objectives[1] });
    }
}
let d = [frontData, otherData];
var cel = document.getElementById("myChart");
var ctx = cel.getContext('2d');
var scatterChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [{
                label: 'pareto front',
                data: d[0],
                backgroundColor: 'rgba(0, 50, 255, 1)'
            }, {
                label: 'data',
                data: d[1],
                backgroundColor: 'rgba(0, 0, 0, 0.25)'
            }]
    },
    options: {
        responsive: false,
        scales: {
            xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        min: 0,
                        max: 1
                    }
                }],
            yAxes: [{
                    type: 'linear',
                    position: 'left',
                    ticks: {
                        min: 0,
                        max: 10
                    }
                }]
        }
    }
});
