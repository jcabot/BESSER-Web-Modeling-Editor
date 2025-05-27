import React, { Component, ComponentClass } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import styled from 'styled-components';
import { Button } from '../../../components/controls/button/button';
import { Divider } from '../../../components/controls/divider/divider';
import { ExchangeIcon } from '../../../components/controls/icon/exchange';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Header } from '../../../components/controls/typography/typography';
import { I18nContext } from '../../../components/i18n/i18n-context';
import { localized } from '../../../components/i18n/localized';
import { ModelState } from '../../../components/store/model-state';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { UMLRelationshipRepository } from '../../../services/uml-relationship/uml-relationship-repository';
import { AgentStateTransition, IUMLStateTransition } from './agent-state-transition';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { StylePane } from '../../../components/style-pane/style-pane';

const Flex = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

const ParamContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const ParamControls = styled.div`
  display: flex;
  gap: 4px;
`;

type State = { 
  colorOpen: boolean;
  paramIds: string[];
};

type OwnProps = {
  element: AgentStateTransition;
};

type StateProps = {};

type DispatchProps = {
  update: typeof UMLElementRepository.update;
  delete: typeof UMLElementRepository.delete;
  flip: typeof UMLRelationshipRepository.flip;
};

type Props = OwnProps & StateProps & DispatchProps & I18nContext;

class AgentStateTransitionUpdateClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      colorOpen: false,
      paramIds: Object.keys(props.element.params).length > 0 
        ? Object.keys(props.element.params).sort() 
        : ['0']
    };
  }

  private toggleColor = () => {
    this.setState((state) => ({
      colorOpen: !state.colorOpen,
    }));
  };

  private addParam = () => {
    const newId = (Math.max(...this.state.paramIds.map(Number)) + 1).toString();
    this.setState(
      prevState => ({ paramIds: [...prevState.paramIds, newId] }),
      () => {
        const newParams = { ...this.props.element.params, [newId]: '' };
        this.props.update<AgentStateTransition>(this.props.element.id, { params: newParams });
      }
    );
  };

  private removeParam = (id: string) => {
    this.setState(
      prevState => ({
        paramIds: prevState.paramIds.filter(paramId => paramId !== id)
      }),
      () => {
        const newParams = { ...this.props.element.params };
        delete newParams[id];
        this.props.update<AgentStateTransition>(this.props.element.id, { params: newParams });
      }
    );
  };

  private handleParamChange = (id: string, value: string) => {
    const newParams = { ...this.props.element.params, [id]: value };
    this.props.update<AgentStateTransition>(this.props.element.id, { params: newParams });
  };

  render() {
    const { element } = this.props;
    // Fetch intent names from localStorage "apollonModels"
    let intentNames: string[] = [];
    try {
      const stored = localStorage.getItem("apollonModels");
      if (stored) {
      const parsed = JSON.parse(stored);
      // Assuming the structure: { AgentDiagram: { elements: { ... } } }
      const elements = parsed?.AgentDiagram?.elements || {};
      intentNames = Object.values(elements)
        .filter((el: any) => el.type === "Intent" && typeof el.name === "string")
        .map((el: any) => el.name);
      }

    } catch (e) {

    }
    return (
      <div>
        <section>
          <Flex>
            <Header gutter={false} style={{ flexGrow: 1 }}>
              {this.props.translate('packages.AgentDiagram.StateTransition')}
            </Header>
            <ColorButton onClick={this.toggleColor} />
            <Button color="link" onClick={() => this.props.flip(element.id)}>
              <ExchangeIcon />
            </Button>
            <Button color="link" onClick={() => this.props.delete(element.id)}>
              <TrashIcon />
            </Button>
          </Flex>
          <Divider />
        </section>
        <section>
        </section>
        <section>
          <Header>Condition</Header>
            <select
            value={element.condition || "when_intent_matched"}
            onChange={e =>
              this.props.update<AgentStateTransition>(element.id, { condition: e.target.value })
            }
            style={{ width: "100%", padding: "6px", marginTop: "4px", marginBottom: "12px" }}
            >
            <option value="when_intent_matched">When Intent Matched</option>
            <option value="when_no_intent_matched">When No Intent Matched</option>
            <option value="when_variable_operation_matched">Variable Operation Matched</option>
            <option value="when_file_received">File Received</option>
            <option value="auto">Auto Transition</option>
            </select>
            {/* Intent name dropdown, only shown if condition is "when_intent_matched" */}
            {element.condition === "when_intent_matched" && (
            <React.Fragment>
              <select
              value={element.intentName || ""}
              onChange={e =>
                this.props.update<AgentStateTransition>(element.id, { intentName: e.target.value })
              }
              style={{ width: "100%", padding: "6px", marginTop: "4px", marginBottom: "12px" }}
              >
              <option value="" disabled>
                Select intent
              </option>
              {intentNames.map((name, idx) => (
                <option key={idx} value={name}>
                {name}
                </option>
              ))}
              </select>
            </React.Fragment>
            )}
            {/* Variable match fields, only shown if condition is "variable_matched" */}
            {element.condition === "when_variable_operation_matched" && (
                <React.Fragment>
                <Textfield
                value={element.variable || ""}
                onChange={value =>
                  this.props.update<AgentStateTransition>(element.id, { variable: value })
                }
                placeholder="Variable"
                style={{ marginBottom: "8px" }}
                />
                <select
                value={element.operator || "=="}
                onChange={e =>
                  this.props.update<AgentStateTransition>(element.id, { operator: e.target.value })
                }
                style={{ width: "100%", padding: "6px", marginBottom: "8px" }}
                >
                <option value="<">&lt;</option>
                <option value="<=">&le;</option>
                <option value="==">==</option>
                <option value=">=">&ge;</option>
                <option value=">">&gt;</option>
                <option value="!=">!=</option>
                </select>
                <Textfield
                value={element.targetValue || ""}
                onChange={value =>
                  this.props.update<AgentStateTransition>(element.id, { targetValue: value })
                }
                placeholder="Target value"
                />
                </React.Fragment>
              )}
              {element.condition === "when_file_received" && (
                <select
                value={element.fileType || ""}
                onChange={e =>
                  this.props.update<AgentStateTransition>(element.id, { fileType: e.target.value })
                }
                style={{ width: "100%", padding: "6px", marginTop: "4px", marginBottom: "12px" }}
                >
                <option value="" disabled>
                  Select file type
                </option>
                <option value="PDF">PDF</option>
                <option value="TXT">TXT</option>
                <option value="JSON">JSON</option>
                </select>
              )}
            
        </section>
        <section>
          <Flex>
            <Header>Parameters</Header>
            <Button color="link" onClick={this.addParam}>
              Add
            </Button>
          </Flex>
          {this.state.paramIds.map((id, index) => (
            <ParamContainer key={index}>
              <Textfield
                value={this.props.element.params[id]}
                onChange={(value) => this.handleParamChange(id, value)}
                placeholder={`Parameter ${index + 1}`}
              />
              {this.state.paramIds.length > 1 && (
                <ParamControls>
                  <Button color="link" onClick={() => this.removeParam(id)}>
                  <TrashIcon />
                  </Button>
                </ParamControls>
              )}
            </ParamContainer>
          ))}
        </section>
        <StylePane
          open={this.state.colorOpen}
          element={element}
          onColorChange={this.props.update}
          lineColor
          textColor
        />
      </div>
    );
  }

  private rename = (name: string) => {
    this.props.update<AgentStateTransition>(this.props.element.id, { name });
  };
}

const enhance = compose<ComponentClass<OwnProps>>(
  localized,
  connect<StateProps, DispatchProps, OwnProps, ModelState>(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
    flip: UMLRelationshipRepository.flip,
  }),
);

export const AgentStateTransitionUpdate = enhance(AgentStateTransitionUpdateClass); 