# nsga2

NSGA-II (Non-dominated Sorting Genetic Algorithm II) implementation in TypeScript

## Getting Started

Import the module
```
import {MOEA} from "./nsga2";
```
Specify the objective function
```
// Example for ZDT1 problem
// Input a set of numbers (solution) and returns set of objectives
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
```
Specify the variable function
```
// Example for a case where variable bounds between 0.0 to 1.0
function newX(): number {
    return Math.random();
}
```
Specify required parameters
```
let nsga2 = new MOEA.NSGA2(
    10,     // chromosome size.
    2,      // objective size.
    50,     // population size.
    5,      // amount of generations.
    ZDT1,   // objective function.
    newX    // generate variable function.
);
nsga2.mutationRate = 0.1;  // mutation probability (optional settings).
nsga2.crossoverRate = 0.5; // crossover probability (optional settings).
```
Perform optimization
```
let optimizedSolutions = nsga2.optimize();
```
See [tests](tests) for further example

## Built With

* [TypeScript](https://www.typescriptlang.org) - Programming Language

## Authors

* **Ibnu Athaillah** - *Initial work* - [Aiei](https://github.com/Aiei)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details