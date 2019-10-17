import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import { elements, renderLoader, clearLoader } from './views/base';


/* Global state of the app
- Search object
- Current recipe object
- Shopping list object
- Liked recipes
*/

/*
* Search Controller
*/

const state = {};

window.state = state;

const controlSearch = async () => {
    //1) Get query from the view
    const query = searchView.getInput(); //TODO

    if(query) {
        //2) New Research object and add it to state
        state.search = new Search(query);

        //3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResult();
        renderLoader(elements.searchResList)
        
        try {
            
            //4) Search for recipes
            await state.search.getResults();
    
            //5) Render results on UI 
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (error) {
            alert('Something went wrong with the search');
            clearLoader();
        }
    }

}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
})

elements.resultPage.addEventListener('click', e => {
    let btn = e.target.closest('.btn-inline');
    if(btn) {
        const goToPage = Number(btn.dataset.goto);

        // clear the result and page button
        searchView.clearInput();
        searchView.clearResult();
        

        // render new page
        searchView.renderResults(state.search.result, goToPage);
    }
})

/*
* Recipe Controller
*/

const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#','');
    console.log(id);

    if(id) {
        // Prepare UI for changes
        
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected search item
        if(state.search) searchView.highlightSelectred(id);

        // Create new recipe object
        state.recipe = new Recipe(id);

        try {
            
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
    
            // Calculate servings and time 
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe);
        } catch (error) {
            console.log(error)
            alert('Error processing recipe');
        }
    }
};

// window.addEventListener('hashchange',controlRecipe);
// window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/*
* List Controller
*/

const controlList = () => {
    // Create new list IF there is none yet
    if(!state.list) {
        state.list = new List();
    }
    
    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    })
}

// Handling recipe button clicks

elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        // Decrease button is clicked
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }

    }else if(e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlList();
    }
    
});

// Handling shopping button clicks

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemId;
    console.log(id);
    //Handle delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        // delete item in the list
        state.list.deleteItem(id);
        
        // remove item from UI
        listView.deleteItem(id);
    }
})