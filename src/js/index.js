import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likeView from './views/likeView';
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
            state.recipe.calcServings();
            state.recipe.calcTime();
    
            // Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id));
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



/*
* Like Controller
*/
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const curID = state.recipe.id;

    // User has NOt yet liked current recipe
    if (!state.likes.isLiked(curID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            curID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // Toggle the like btn
        likeView.toggleLikeBtn(true);
        // Add like to UI list
        likeView.renderLike(newLike);
    // User has liked this recipe
    } else {
        // Remove like from the state
        state.likes.deleteLike(curID);
        // Toggle the like btn
        likeView.toggleLikeBtn(false);
        // Remove like from UI list
        likeView.deleteLike(curID);
    }

    likeView.toggleLikeMenu(state.likes.getNumLikes());

};

// Restore liked recipes on page load

window.addEventListener('load', () => {
    state.likes = new Likes();
    
    // Read the storage
    state.likes.readStorage();

    // Toggel like menu button
    likeView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likeView.renderLike(like));
});

// Handling recipe button clicks

elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        // Decrease button is clicked
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            state.recipe.calcTime();
            recipeView.updateServingsIngredients(state.recipe);
            
        }

    }else if(e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        state.recipe.calcTime();
        recipeView.updateServingsIngredients(state.recipe);
        
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // add shopping list
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')) {
        // add like list
        controlLike();
    }
    
});

// Handling shopping button clicks

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    console.log(id);
    //Handle delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        // delete item in the list
        state.list.deleteItem(id);
        
        // remove item from UI
        listView.deleteItem(id);
    }else if(e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
})