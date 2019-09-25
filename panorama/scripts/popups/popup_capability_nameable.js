
'use-strict';

var CapabilityNameable = ( function()
{
	var m_Inspectpanel = $.GetContextPanel(),
		m_elTextEntry = $.GetContextPanel().FindChildInLayoutFile( 'NameableTextEntry' ),
		m_elNameDisplay = $.GetContextPanel().FindChildInLayoutFile( 'NameableItemName' ),
		m_elRemoveConfirm = $.GetContextPanel().FindChildInLayoutFile( 'NameableRemoveConfirm' ),
		m_elValidBtn = $.GetContextPanel().FindChildInLayoutFile( 'NameableValidBtn' ),
		m_elRemoveBtn = $.GetContextPanel().FindChildInLayoutFile( 'NameableRemoveBtn' );

	var m_itemId = '';
	var m_toolId = '';

	var _Init = function()
	{
		var strMsg = $.GetContextPanel().GetAttributeString( "nametag-and-itemtoname", "(not found)" );

		var idList = strMsg.split( ',' );
		m_toolId = idList[ 0 ];
		m_itemId = idList[ 1 ];
		var elModel = $.GetContextPanel().FindChildInLayoutFile( 'NameableNameTagModel' );
		elModel.SetCameraPreset( 2, true );
		m_elNameDisplay.RemoveClass( 'hidden' );

		_SetUpPanelElements();
		_SetUpNameTagModel();

		$.DispatchEvent( 'CapabilityPopupIsOpen', true );
	};

	var _SetItemModel = function( id )
	{
		var elItemModelImagePanel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpInspectModelOrImage' );
		InspectModelImage.Init( elItemModelImagePanel, id );

		elItemModelImagePanel.AddClass( 'popup-inspect-modelpanel_darken' );
	};

	var _SetUpPanelElements = function()
	{
		if ( !m_toolId )
		{
			$.GetContextPanel().SetAttributeString( 'asyncworkitemwarning', 'no' );
		}
		else
		{
			$.GetContextPanel().SetAttributeString( 'toolid', m_toolId );
		}

		_SetUpAsyncActionBar( m_itemId );
		_ShowPurchase( m_toolId );
		_SetupHeader( m_itemId );
		_SetItemModel( m_itemId );

		var noTool = ( m_toolId === '' ) ? true : false;
		var hasName = InventoryAPI.HasCustomName( m_itemId );

		_SetUpButtonStates( m_toolId, m_itemId, hasName, noTool );
		_UpdateTextOnModel( m_itemId, hasName );
		_UpdateAcceptState();
	};
	
	var _SetUpAsyncActionBar = function( itemId )
	{
		var elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpInspectAsyncBar' );
		
		InspectAsyncActionBar.Init(
			elAsyncActionBarPanel,
			itemId,
			_GetSettingCallback,
			_AsyncActionPerformedCallback
		);
	};

	var _ShowPurchase = function( toolId )
	{
		var elPurchase = $.GetContextPanel().FindChildInLayoutFile( 'PopUpInspectPurchaseBar' );
		var fakeItem = '';

		if( !toolId )
		{
			var nametTagStoreId = 1200;
			fakeItem = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( 1200, 0 );
			$.GetContextPanel().SetAttributeString( 'purchaseItemId', fakeItem );
		}

		InpsectPurchaseBar.Init(
			elPurchase,
			fakeItem,
			_GetSettingCallback
		);
	};

	var _SetupHeader = function ( itemId )
	{
		var elCapabilityHeaderPanel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpCapabilityHeader' );
		CapabiityHeader.Init( elCapabilityHeaderPanel, itemId, _GetSettingCallback );
	}

	var _GetSettingCallback = function( settingname, defaultvalue )
	{
		return m_Inspectpanel.GetAttributeString( settingname, defaultvalue );
	};

	var _AsyncActionPerformedCallback = function()
	{
		m_Inspectpanel.FindChildInLayoutFile( 'NameableRemoveConfirm' ).enabled = false;
		m_Inspectpanel.FindChildInLayoutFile( 'NameableValidBtn' ).enabled = false;
	};

	var _SetUpNameTagModel = function()
	{
		var elModel = $.GetContextPanel().FindChildInLayoutFile( 'NameableNameTagModel' );
		elModel.SetCameraPreset( 1, false );
		elModel.SetCameraPreset( 2, true );

		                                              
		elModel.SetDirectionalLightModify( 0 );
		elModel.SetDirectionalLightRotation( 30, 90, 10 );
	}

	var _SetUpButtonStates = function( toolId, itemId, hasName, noTool )
	{
		var elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpInspectAsyncBar' );
		InspectAsyncActionBar.EnableDisableOkBtn( elAsyncActionBarPanel, false );

		m_elValidBtn.SetHasClass( 'hidden', noTool );

		m_elValidBtn.SetPanelEvent( 'onactivate', function()
		{
			$.DispatchEvent( "PlaySoundEffect", "rename_select", "MOUSE" );
			InspectAsyncActionBar.EnableDisableOkBtn( elAsyncActionBarPanel, true );
			m_elTextEntry.enabled = false;
			                               
			m_elRemoveBtn.SetHasClass( 'hidden', false );
			m_elValidBtn.SetHasClass( 'hidden', true );
		} );

		m_elRemoveBtn.SetPanelEvent( 'onactivate', function()
		{
			InspectAsyncActionBar.EnableDisableOkBtn( elAsyncActionBarPanel, false );
			m_elTextEntry.enabled = true;
			m_elTextEntry.SetFocus();
			m_elRemoveBtn.SetHasClass( 'hidden', true );
			m_elValidBtn.SetHasClass( 'hidden', false );
			m_elTextEntry.text = '';
		} );

		m_elRemoveConfirm.SetPanelEvent( 'onactivate',
			_OnRemoveConfirm.bind( undefined, itemId ) );

		m_elRemoveConfirm.SetHasClass( 'hidden', !hasName );
		m_elTextEntry.SetFocus();
		m_elTextEntry.SetMaxChars( 20 );
		m_elTextEntry.text = _SetDefaultTextForTextEntry( hasName, itemId );
	};

	var _SetDefaultTextForTextEntry = function( hasName, itemId )
	{
		if ( m_elTextEntry.text !== '' )
		{
			return m_elTextEntry.text;
		}

		return hasName ? ItemInfo.GetName( itemId ) : '';
	};

	var _OnRemoveConfirm = function( itemId )
	{
		                                       

		var temp = UiToolkitAPI.ShowGenericPopupOkCancel(
			$.Localize( '#popup_nameable_remove_confirm_title' ),
			$.Localize( '#tooltip_nameable_remove' ),
			'',
			function()
			{
				                                        
				InventoryAPI.ClearCustomName( itemId );
				_ClosePopup();
				$.DispatchEvent( 'HideSelectItemForCapabilityPopup' );
			},
			function()
			{
			}
		);
	};

	var _UpdateTextOnModel = function( itemId, hasName )
	{
		if ( hasName )
			m_elNameDisplay.text = ItemInfo.GetName( itemId );
		else
			m_elNameDisplay.text = m_elTextEntry.text;
	};

	var _OnEntryChanged = function()
	{
		if ( m_elNameDisplay && m_elNameDisplay.IsValid() )
		{
			$.DispatchEvent( "PlaySoundEffect", "rename_teletype", "MOUSE" );
			m_elNameDisplay.text = m_elTextEntry.text;
			_UpdateAcceptState();
		}
	};

	var _UpdateAcceptState = function()
	{
		var isValid = InventoryAPI.SetNameToolString( m_elTextEntry.text );
		                               
		m_elValidBtn.enabled = isValid;

		var onMouseOver = function( isValid )
		{
			if ( !isValid )
				UiToolkitAPI.ShowTextTooltip( 'NameableValidBtn', '#tooltip_nameable_invalid' );
		}

		m_elValidBtn.SetPanelEvent( 'onmouseover', onMouseOver.bind( undefined, isValid ) );
		m_elValidBtn.SetPanelEvent( 'onmouseout', function()
		{
			UiToolkitAPI.HideTextTooltip();
		} );
	};

	var _NameTagAcquired = function( ItemId )
	{
		if ( m_toolId === '' )
		{
			if ( ItemInfo.ItemMatchDefName( ItemId, 'name tag' ) )
			{
				m_toolId = ItemId;
				                                 
				$.DispatchEvent( 'HideStoreStatusPanel', '' );
				_SetUpPanelElements();
				_AcknowlegeNameTags();
			}
		}
	};

	var _AcknowlegeNameTags = function()
	{
		var bShouldAcknowledge = true;
		AcknowledgeItems.GetItemsByType( [ 'name tag' ], bShouldAcknowledge );
	};

	var _ClosePopup = function()
	{
		var elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpInspectAsyncBar' );
		var elPurchase = $.GetContextPanel().FindChildInLayoutFile( 'PopUpInspectPurchaseBar' );

		if( !elAsyncActionBarPanel.BHasClass( 'hidden' ))
		{
			InspectAsyncActionBar.OnEventToClose();
		}
		else if ( !elPurchase.BHasClass( 'hidden' ) )
		{
			InpsectPurchaseBar.ClosePopup();
		}
	};

	return {
		Init: _Init,
		OnEntryChanged: _OnEntryChanged,
		NameTagAcquired: _NameTagAcquired,
		ClosePopup: _ClosePopup
	}
} )();

( function()
{
	$.RegisterForUnhandledEvent( 'PanoramaComponent_Store_PurchaseCompleted', CapabilityNameable.NameTagAcquired );
} )();
