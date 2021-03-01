import React, { Component, createRef } from 'react';
import {
  shape, arrayOf, string, bool,
} from 'prop-types';
import { Link } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ML_PROJECT } from 'dataTypes';
import ArrowButton from 'components/arrow-button/arrowButton';
import MWrapper from 'components/ui/MWrapper';
import * as projectActions from 'store/actions/projectInfoActions';
import * as userActions from 'store/actions/userActions';
import ProjectSet from '../../projectSet';
import './MProjectClassification.scss';
import MCheckBox from '../MCheckBox/MCheckBox';
import { getSearchable } from './functions';

class MProjectClassification extends Component {
  projFilterBtnsList = ['personal', 'starred', 'explore'];

  personalBtnRef = createRef();

  constructor(props) {
    super(props);
    this.state = {
      isDataTypesVisible: true,
      isFrameworksVisible: true,
      isModelTypesVisible: true,
      isMlCategoriesVisible: true,
    };
    this.handleClickDataTypesButton.bind(this);
    this.handleClickFrameworkButton.bind(this);
    this.handleClickModelTypeButton.bind(this);
    this.handleClickMlCategoriesButton.bind(this);
  }

  componentDidMount() {
    this.updateActiveButtons();
  }

  componentDidUpdate() {
    this.updateActiveButtons();
  }

  changeScreen = async (screen) => {
    const {
      history: {
        push,
        location: {
          pathname,
        },
      },
      actions,
    } = this.props;

    actions.setIsLoading(true);
    push(`${pathname}${screen}`);
  }

  handleClickDataTypesButton = () => this.setState((prevState) => ({
    isDataTypesVisible: !prevState.isDataTypesVisible,
  }));

  handleClickFrameworkButton = () => this.setState((prevState) => ({
    isFrameworksVisible: !prevState.isFrameworksVisible,
  }));

  handleClickModelTypeButton = () => this.setState((prevState) => ({
    isModelTypesVisible: !prevState.isModelTypesVisible,
  }));

  handleClickMlCategoriesButton = () => this.setState((prevState) => ({
    isMlCategoriesVisible: !prevState.isMlCategoriesVisible,
  }));

  handleFilterButtonClick = (screen) => async () => {
    const { setPage } = this.props;
    setPage(0);
    this.changeScreen(screen);
    this.updateActiveButtons();
  };

  updateActiveButtons = async () => {
    const { classification, history: { location: { hash } } } = this.props;
    const buttonType = hash ? hash.substring(1, hash.length) : this.projFilterBtnsList[0];
    let elementBtn;
    this.projFilterBtnsList.forEach((btnId) => {
      elementBtn = document.getElementById(`${classification}-${btnId}-btn`);
      if (elementBtn) elementBtn.classList.replace('btn-basic-info', 'btn-basic-dark');
    });
    elementBtn = document.getElementById(`${classification}-${buttonType}-btn`);
    if (elementBtn) elementBtn.classList.replace('btn-basic-dark', 'btn-basic-info');
  }

  render() {
    const {
      isDataTypesVisible,
      isFrameworksVisible,
      isMlCategoriesVisible,
      isModelTypesVisible,
    } = this.state;

    const {
      classification,
      allProjects,
      isLoading,
    } = this.props;
    const dataTypes = [
      { label: 'Text' },
      { label: 'Image' },
      { label: 'Audio' },
      { label: 'Video' },
      { label: 'Tabular' },
    ].map((dT) => ({ ...dT, name: `${classification} dataTypes` }));
    const frameworks = [
      { label: 'TensorFlow' },
      { label: 'Pytorch' },
      { label: 'Keras' },
      { label: 'Scikit Learn' },
    ].map((dT) => ({ ...dT, name: `${classification} framework` }));

    const modelTypes = [
      { label: 'CNN' },
      { label: 'Clustering' },
      { label: 'Trees' },
      { label: 'Regression' },
    ].map((dT) => ({ ...dT, name: `${classification} modelTypes` }));

    const mlCategories = [
      { label: 'Regression' },
      { label: 'Prediction' },
      { label: 'Classification' },
      { label: 'Dimensionality reduction' },
    ].map((dT) => ({ ...dT, name: `${classification} mlCategories` }));

    return (
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div className="flex-1 mx-5">
          <div className="scroll-styled" id="buttons-div">
            <div id="filter-div">
              <button
                id={`${classification}-personal-btn`}
                onClick={this.handleFilterButtonClick('#personal')}
                type="button"
                className="btn btn-basic-dark"
              >
                My projects
              </button>
              <button
                id={`${classification}-starred-btn`}
                onClick={this.handleFilterButtonClick('#starred')}
                type="button"
                className="btn btn-basic-dark"
              >
                Starred
              </button>
              <button
                id={`${classification}-explore-btn`}
                onClick={this.handleFilterButtonClick('#explore')}
                type="button"
                className="btn btn-basic-dark"
              >
                Explore
              </button>
            </div>
            <div id="new-element-container" className="ml-auto">
              <Link
                to={`/new-project/classification/${classification}`}
                data-cy="project-create-btn"
                type="button"
                className="btn btn-primary"
              >
                {`New ${classification}`.replace('-', ' ')}
              </Link>
            </div>
          </div>
          <div className="m-project-classification">
            <ProjectSet
              allProjects={allProjects}
              isLoading={isLoading}
              classification={classification}
            />
            <MWrapper disable title="Not available yet.">
              <div className="d-none d-lg-block" id="side-filters">
                <div id="input-div">
                  <p>Refine by</p>
                  <button>Clear filters</button>
                </div>
                <br />
                <>
                  <div className="name-filter-section">
                    <p>
                      Data types
                    </p>
                    <ArrowButton callback={this.handleClickDataTypesButton} />
                  </div>
                  {isDataTypesVisible && (
                    dataTypes.map((dtype) => (
                      <MCheckBox
                        key={`${dtype.name} ${dtype.label} comp`}
                        name={dtype.name}
                        labelValue={dtype.label}
                        callback={(name, labelValue, newValue) => {

                        }}
                      />
                    ))
                  )}
                </>
                <>
                  <div className="name-filter-section">
                    <p>
                      Framework
                    </p>
                    <ArrowButton callback={this.handleClickFrameworkButton} />
                  </div>
                  {isFrameworksVisible && (
                    frameworks.map((dtype) => (
                      <MCheckBox
                        key={`${dtype.name} ${dtype.label} comp`}
                        name={dtype.name}
                        labelValue={dtype.label}
                        callback={(name, labelValue, newValue) => {

                        }}
                      />
                    ))
                  )}
                </>
                <>
                  <div className="name-filter-section">
                    <p>
                      Model Type
                    </p>
                    <ArrowButton callback={this.handleClickModelTypeButton} />
                  </div>
                  {isModelTypesVisible && (
                    modelTypes.map((dtype) => (
                      <MCheckBox
                        key={`${dtype.name} ${dtype.label} comp`}
                        name={dtype.name}
                        labelValue={dtype.label}
                        callback={(name, labelValue, newValue) => {

                        }}
                      />
                    ))
                  )}
                </>
                <>
                  <div className="name-filter-section">
                    <p>
                      ML categories
                    </p>
                    <ArrowButton callback={this.handleClickMlCategoriesButton} />
                  </div>
                  {isMlCategoriesVisible && (
                    mlCategories.map((dtype) => (
                      <MCheckBox
                        key={`${dtype.name} ${dtype.label} comp`}
                        name={dtype.name}
                        labelValue={dtype.label}
                        callback={(name, labelValue, newValue) => {

                        }}
                      />
                    ))
                  )}
                </>
              </div>
            </MWrapper>
          </div>
        </div>
      </div>
    );
  }
}

MProjectClassification.propTypes = {
  classification: string.isRequired,
  allProjects: arrayOf(shape({})),
  isLoading: bool,
};

MProjectClassification.defaultProps = {
  allProjects: [],
  isLoading: false,
};

function mapStateToProps(state) {
  return {
    userInfo: state.user.userInfo,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      getPaginatedProjectsByQuery: projectActions.getPaginatedProjectsByQuery,
      getProcessorsPaginated: projectActions.getProcessorsPaginated,
      setIsLoading: userActions.setIsLoading,
    }, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MProjectClassification);
