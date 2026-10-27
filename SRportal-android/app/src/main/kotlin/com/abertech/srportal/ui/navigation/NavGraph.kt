package com.abertech.srportal.ui.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.abertech.srportal.core.RescueStatus
import com.abertech.srportal.di.LocalAppContainer
import com.abertech.srportal.di.SarViewModelFactory
import com.abertech.srportal.ui.home.HomeScreen
import com.abertech.srportal.ui.rescue.BeginModelScreen
import com.abertech.srportal.ui.rescue.LastSeenScreen
import com.abertech.srportal.ui.rescue.LocationStepScreen
import com.abertech.srportal.ui.rescue.MapPickerScreen
import com.abertech.srportal.ui.rescue.NewRescueViewModel
import com.abertech.srportal.ui.rescue.TravelModeScreen
import com.abertech.srportal.ui.rescues.RescueListScreen
import com.abertech.srportal.ui.results.ResultsScreen
import com.abertech.srportal.ui.settings.SettingsScreen
import com.abertech.srportal.ui.splash.SplashScreen

/**
 * Route names, kept in one place so screens never build strings themselves.
 */
object Routes {
    const val SPLASH = "splash"
    const val HOME = "home"
    const val NEW_LOCATION = "new/location"
    const val NEW_MAP = "new/map"
    const val NEW_MODE = "new/mode"
    const val NEW_TIME = "new/time"
    const val NEW_BEGIN = "new/begin"
    const val RESULTS = "results/{id}"
    const val ONGOING = "rescues/ongoing"
    const val COMPLETED = "rescues/completed"
    const val SETTINGS = "settings"

    fun results(id: String): String = "results/$id"
}

/**
 * Splash, home, the New Rescue wizard, results, lists and settings.
 */
@Composable
fun SrPortalNavGraph() {
    val container = LocalAppContainer.current
    val navController = rememberNavController()
    val wizard: NewRescueViewModel = viewModel(factory = SarViewModelFactory { NewRescueViewModel(container) })

    NavHost(navController = navController, startDestination = Routes.SPLASH) {
        composable(Routes.SPLASH) {
            SplashScreen(
                onReady = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.HOME) {
            HomeScreen(
                onNewRescue = {
                    wizard.reset()
                    navController.navigate(Routes.NEW_LOCATION)
                },
                onOngoing = { navController.navigate(Routes.ONGOING) },
                onCompleted = { navController.navigate(Routes.COMPLETED) },
                onSettings = { navController.navigate(Routes.SETTINGS) },
            )
        }
        composable(Routes.NEW_LOCATION) {
            LocationStepScreen(
                viewModel = wizard,
                onOpenMap = { navController.navigate(Routes.NEW_MAP) },
                onConfirm = { navController.navigate(Routes.NEW_MODE) },
            )
        }
        composable(Routes.NEW_MAP) {
            MapPickerScreen(viewModel = wizard, onConfirm = { navController.navigate(Routes.NEW_MODE) })
        }
        composable(Routes.NEW_MODE) {
            TravelModeScreen(viewModel = wizard, onConfirm = { navController.navigate(Routes.NEW_TIME) })
        }
        composable(Routes.NEW_TIME) {
            LastSeenScreen(viewModel = wizard, onConfirm = { navController.navigate(Routes.NEW_BEGIN) })
        }
        composable(Routes.NEW_BEGIN) {
            BeginModelScreen(
                viewModel = wizard,
                onPlanReady = { id ->
                    navController.navigate(Routes.results(id)) {
                        popUpTo(Routes.HOME)
                    }
                },
            )
        }
        composable(Routes.RESULTS, arguments = listOf(navArgument("id") { type = NavType.StringType })) { entry ->
            val id = entry.arguments?.getString("id").orEmpty()
            ResultsScreen(rescueId = id, onBack = { navController.popBackStack() })
        }
        composable(Routes.ONGOING) {
            RescueListScreen(
                status = RescueStatus.ONGOING,
                onOpen = { id -> navController.navigate(Routes.results(id)) },
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.COMPLETED) {
            RescueListScreen(
                status = RescueStatus.COMPLETED,
                onOpen = { id -> navController.navigate(Routes.results(id)) },
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(onBack = { navController.popBackStack() })
        }
    }
}
