class ComplexityTest {
  calculate(x: number, y: number): number {
    if (x > 0 && y > 0) {
      for (let i = 0; i < x; i++) {
        if (i % 2 === 0) {
          y += i;
        }
      }
    }
    return y;
  }
}