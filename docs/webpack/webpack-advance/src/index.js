import './index.less'
class Animal {
  constructor (name) {
    this.name = name
    this.age = 10
  }

  static setAge (num) {
    this.age = 11
  }

  getAge () {
    return this.age
  }

  getName () {
    return this.name
  }
}

const dog = new Animal('dog')
window.Animal = Animal
window.dog = dog
console.log(dog)
console.log(Vue)

document.write('小青菜八八八八')