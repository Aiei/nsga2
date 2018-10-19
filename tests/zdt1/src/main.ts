import { MOEA } from "./nsga2";

function ZDT1(x: number[]): number[] {
    let xi = 0;
    for (let i = 1; i < x.length; i++) {
        xi += x[i];
    }
    let g = 1 + (9 / (x.length - 1) * xi);
    let f1 = x[0];
    let f2 = g * (1 - Math.sqrt(f1 / g));
    return [f1, f2];
}

function newX(): number {
    return Math.random();
}

let nsga2 = new MOEA.NSGA2(
    20,     // chromosome size.
    2,      // objective size.
    50,     // population size.
    50,      // amount of generations.
    ZDT1,   // objective function.
    newX    // generate variable function.
);
nsga2.mutationRate = 0.1;  // mutation probability (optional settings).
nsga2.crossoverRate = 0.5; // crossover probability (optional settings).
// Main call
let pop = nsga2.optimize();

/** Chart visualization */
declare var Chart: any;
// Output formatting
let frontData: {x: number, y: number}[] = [];
let otherData: {x: number, y: number}[] = [];
let r = 1;
for (let i of pop) {
    if (i.paretoRank == r) {
        frontData.push({x:i.objectives[0], y:i.objectives[1]});
    } else {
        otherData.push({x:i.objectives[0], y:i.objectives[1]});
    }
}
let d = [frontData, otherData];
// Draw chart
var cel = <HTMLCanvasElement>document.getElementById("myChart");
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