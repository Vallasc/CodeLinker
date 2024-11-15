export function testFunction() {}
const testFunction2 = () => {}

class TestClass {
  constructor() {
    console.log("TestClass instance created");
  }

  testMethod1() {
    console.log("testMethod1 called");
  }

  testMethod2 = () => {
    console.log("testMethod1 called");
  }

  InnerClass = class {
    constructor() {
      console.log("InnerClass instance created");
    }

    innerMethod() {
      console.log("innerMethod called");
    }
  }

  createInnerInstance() {
    return new this.InnerClass();
  }
}
