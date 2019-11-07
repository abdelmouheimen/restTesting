import React, { Component } from 'react'
import { DropTarget } from 'react-dnd'
import { Button,Message } from 'semantic-ui-react'
import Path from './Path';
import SecurityDefinition from './SecurityDefinition';
import Helper from './Helper';
import { DRAG_TYPES } from './Path';

const dropArea = {
  borderWidth: 2,
  borderColor: '#666',
  borderStyle: 'dashed',
  height: (window.innerHeight - 165) + 'px',
  maxHeight: (window.innerHeight - 165) + 'px',
  overflowY: 'auto',
  borderRadius: 5
}

const boxTarget = {
  drop(props) {
    return { ...props.scenario }
  },
}

@DropTarget(DRAG_TYPES.PATH, boxTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
}))
class Scenario extends Component {

  constructor(props) {
    super(props);
    this.state = {scenario: this.props.scenario};
    this.sayHello = this.sayHello.bind(this);
}

  traitementUrlGet(url, path) {
    var array = url.split("/");
    var urlTemp= url;
    var param;
    for (let i = 0; i < array.length; i++) {
      if (array[i].includes("{")) {
        param = array[i].substr(1).slice(0, -1);
        if (typeof path.testValues === 'undefined') {
          alert("you should set the -----" + param + "----- parameter");
          urlTemp = "";
        } else {
          array[i] = path.testValues[param];
          urlTemp = array.join("/");
        }
        
      }
    }
    var parameters = path.spec.parameters;
    for (let i = 0; i < parameters.length; i++) {
        if((typeof path.testValues === 'undefined' || typeof path.testValues[parameters[i].name] === 'undefined')&& !(url.includes("{"+parameters[i].name+"}")) ){
          alert("you should set the -----" + parameters[i].name + "----- parameter");
          urlTemp = "";
        }else if (!(typeof path.testValues === 'undefined') && !(typeof path.testValues[parameters[i].name] === 'undefined') && !(url.includes("{"+parameters[i].name+"}"))){
          urlTemp+="?"+parameters[i].name+"="+path.testValues[parameters[i].name];
        }
    }
    return urlTemp;
  }

  testExtraction(data,path){
    if(!(typeof path.extractions === 'undefined')){
    var extractions = path.extractions;
    var extractionNotExist = "";
    var extractionFailed = "";
    var extractionPassed="";
      for(let i=0;i<extractions.length;i++){
        if((extractions[i].value in data)==false){
          extractionNotExist+=extractions[i].value+" does not exists in returned data ";
          path.extractions[i].notExists= extractions[i].value;
        }else{
          if(extractions[i].as == data[extractions[i].value]){
            extractionPassed+= "the "+extractions[i].value+" is equal to "+ extractions[i].as;
            path.extractions[i].failure= extractions[i].value;
          }else{
            extractionFailed+="the "+extractions[i].value+" is not equal to "+ extractions[i].as;
            path.extractions[i].success= extractions[i].value;
          }
        }
      }

    }
  }

  sayHello() {
    this.state.scenario.paths.map((path) => {
      switch (path.method.toLowerCase()) {
        case "get":
          let url = "https://petstore.swagger.io/v2" + path.path;
          url = this.traitementUrlGet(url, path);
          if (url != "") {
            fetch(url)
              .then(res => res.json())
              .then(data => this.testExtraction(data,path))
              .catch();
            console.log(path);
          }

      }
    })

  }
  render() {
    const { canDrop, isOver, connectDropTarget, scenario, onAssertionsChange, onExtractionsChange, onTestValueChange } = this.props
    const isActive = canDrop && isOver
    const borderColor = isActive ? 'green' : '#666'
    const borderStyle = isActive ? 'solid' : 'dashed'

    return connectDropTarget(

      <div style={{ ...dropArea, borderStyle, borderColor }}>

        {scenario && scenario.paths && scenario.paths.map((path, i) => {
          if (path.type === 'PATH') {
            return <Path
              key={i}
              color={path.color}
              disabled={path.disabled}
              path={path.path}
              method={path.method}
              summary={path.summary}
              spec={path.spec}
              testValues={path.testValues || {}}
              assertions={path.assertions}
              extractions={path.extractions}
              onAssertionsChange={(assertions) => onAssertionsChange(path, assertions)}
              onExtractionsChange={(extractions) => onExtractionsChange(path, extractions)}
              onTestValueChange={(paramName, value) => onTestValueChange(path, paramName, value)}
              selectParams />
          } else if (path.type === 'SECURITY_DEFINITION') {
            return <SecurityDefinition key={i} spec={path.spec} name={path.name} selectParams />
          } else if (path.type === 'HELPER') {
            return <Helper key={i} name={path.name} selectParams/>
          }
          return <Message>Operation not supported</Message>
        })}
        <Button.Group floated='right'>
                          <Button basic color='green' icon='play' onClick={this.sayHello}></Button>
                          <Button basic color='green' icon='forward'></Button>
                        </Button.Group>
      </div>
    )
  }
}

export default Scenario